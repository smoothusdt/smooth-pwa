import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/components/Link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { AlertCircle, Loader2 } from "lucide-react";

import toast, { Toaster } from "react-hot-toast";

import { useSmooth } from "@/hooks/useSmooth/useSmooth";
import { SmoothFee } from "@/constants";
import { getTronScanLink } from "@/util";
import { useUSDTBalance } from "@/hooks/useUSDTBalance";
import { usePwa } from "@/hooks/usePwa";
import { usePostHog } from "posthog-js/react";
import { useWallet } from "@/hooks/useWallet";
import { TronWeb } from "tronweb";
import { CheckApprovalResult } from "@/hooks/useSmooth/approve";

/** Full page components which owns the send flow */
export const Send = () => {
  const posthog = usePostHog();
  const { connected } = useWallet();
  const [receiver, setReceiver] = useState("");
  const [sending, setSending] = useState(false);
  const balance = useUSDTBalance();
  const { isOffline } = usePwa();
  const [checkApproval, transfer] = useSmooth();

  const [amountRaw, setAmountRaw] = useState<string>("");
  const amount = parseInt(amountRaw) || 0;

  if (!connected) return; // wait until the wallet loads

  const isOverspending =
    balance !== undefined && amountRaw && amount + SmoothFee > balance;
  const receiverInvalid = receiver && !TronWeb.isAddress(receiver);

  let alert = "";
  if (isOverspending) {
    alert = "You can't send more than you have";
  } else if (receiverInvalid) {
    alert = '"To" is not a valid address';
  }

  const sendDisabled =
    sending ||
    amount === 0 ||
    receiver === "" ||
    isOverspending ||
    receiverInvalid ||
    isOffline;

  const reset = () => {
    setAmountRaw("");
    setReceiver("");
    setSending(false);
  };

  // The button is disabled until the data in the fields is valid, so we
  // can omit validation here.
  const handleTransferClicked = async () => {
    // Set up a fn that will execute the transfer so that we can toast this
    const doTransfer = async () => {
      try {
        setSending(true);

        // make sure the router is approved. Executes instantly if the approval
        // is granted and known in local storage.
        const [approvalGranted, checkApprovalResult] = await checkApproval();
        if (!approvalGranted) {
          console.error("Approval was not granted before sending!");
          posthog.capture("Approval was not granted before sending!", {
            approvalGranted,
            checkApprovalResult,
          });
          throw new Error("Something went wrong. Please try again.");
        }

        // Make an informational warning if we had to execute the approval just now.
        // Normally the approval executes in the background.
        if (checkApprovalResult !== CheckApprovalResult.AlreadyGranted) {
          console.warn("Approval was granted, but not in background");
          posthog.capture("Approval was granted, but not in background", {
            approvalGranted,
            checkApprovalResult,
          });
        }

        const res = await transfer(receiver, amount!);
        reset();
        return res;
      } catch (e) {
        reset();
        posthog.capture("error", {
          error: JSON.stringify(e, Object.getOwnPropertyNames(e)),
        });
        throw e;
      }
    };

    // Do the transfer and display the process using a toast
    toast.promise(
      doTransfer(),
      {
        loading: "Sending...",
        success: (data) => (
          <span>
            Sent! {/* target=_blank to open in a new tab */}
            <Link href={getTronScanLink(data.txID)} target="_blank">
              View on TronScan
            </Link>
          </span>
        ),
        error: (err) => `Failed to send: ${err.toString()}`,
      },
      {
        style: {
          minWidth: "250px",
        },
        success: {
          duration: 6000,
          icon: "🔥",
        },
      },
    );
  };

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex flex-col gap-3">
        <Label htmlFor="text-input-to">To</Label>
        {/* https://stackoverflow.com/questions/2989263/disable-auto-zoom-in-input-text-tag-safari-on-iphone */}
        <Input
          id="text-input-to"
          type="text"
          value={receiver}
          onChange={(e) => setReceiver(e.target.value)}
          placeholder="TR7NHq...gjLj6t"
        />
        <Label htmlFor="text-input-amount">Amount (USDT)</Label>
        <Input
          id="text-input-amount"
          type="number"
          inputMode="decimal"
          value={amountRaw}
          onChange={(e) => setAmountRaw(e.target.value)}
          min={0}
          placeholder="10"
        />
        <span className="text-sm text-muted-foreground">
          Fee: {SmoothFee} <span className="text-[0.5rem]">USDT</span>
        </span>
        {Boolean(amount) && (
          <span className="text-sm text-muted-foreground">
            Total: <strong>{amount + SmoothFee}</strong>{" "}
            <span className="text-[0.5rem]">USDT</span>
          </span>
        )}
        <Toaster />
      </div>
      <div className="flex flex-col gap-4">
        {alert && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Whoops</AlertTitle>
            <AlertDescription>{alert}</AlertDescription>
          </Alert>
        )}
        <Button disabled={sendDisabled} onClick={handleTransferClicked}>
          {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {sending ? "Sending" : "Send"}
        </Button>
      </div>
    </div>
  );
};
