import { UserChoice, reinstallApp, usePwa } from "@/hooks/usePwa";
import { Page, PageContent, PageHeader } from "./Page";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { CircleCheck, Globe, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import { SafariShareIcon } from "./svgs";
import { CopyText } from "./CopyText";
import { Link } from "./Link";
import { usePostHog } from "posthog-js/react";

function SafariInstructions(props: {
  showDrawer: boolean;
  setShowDrawer?: (arg0: boolean) => void;
  onClickDone?: () => void;
}) {
  return (
    <Drawer nested open={props.showDrawer} onOpenChange={props.setShowDrawer}>
      <DrawerContent className="sm:max-w-[425px]">
        <DrawerHeader>
          <DrawerTitle className="pb-4">Install via Safari</DrawerTitle>
          <DrawerDescription className="flex flex-col gap-4 px-8">
            <ol className="list-decimal text-muted-foreground text-sm text-left flex flex-col gap-4">
              <li>
                Tap the{" "}
                <span className="inline-block">
                  <SafariShareIcon />
                </span>{" "}
                share icon in Safari
              </li>
              <li>Scroll down</li>
              <li>
                Tap{" "}
                <span className="border border-solid border-muted-foreground rounded-full p-2">
                  Add to Home Screen
                </span>
              </li>
            </ol>
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="flex flex-col gap-2">
          <Button onClick={props.onClickDone}>Done</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function InstallPrompt(props: { onInstallClicked: () => void }) {
  return (
    <PageContent>
      <div className="h-full flex flex-col justify-between">
        <div /> {/* for flex alignment */}
        <div className="flex flex-col gap-4 text-center items-center">
          <Globe size={64} className="text-primary" />
          <p className="text-2xl text-center">
            Welcome to smooth
            <br />
            <span className="text-sm text-center text-muted-foreground">
              Install the app and send USDT with ease.
              <br />
              (in TRC-20 network)
            </span>
          </p>
        </div>
        <Button size="lg" onClick={props.onInstallClicked}>
          Install App
        </Button>
      </div>
    </PageContent>
  );
}

function Installing() {
  return (
    <PageContent>
      <div className="h-full flex flex-col justify-center items-center">
        <Loader2 className="h-4 w-4 animate-spin" />
        <p className="text-sm">Installing...</p>
      </div>
    </PageContent>
  );
}

function AppInstalled(props: { allowReinstall?: boolean }) {
  return (
    <PageContent>
      <div className="h-full flex flex-col justify-between">
        <div /> {/* for flex alignment */}
        <div className="flex flex-col gap-4 text-center items-center">
          <CircleCheck size={64} className="text-primary" />
          <span className="text-lg font-semibold">App installed</span>
          <p className="text-muted-foreground text-sm">
            Open Smooth USDT app and start making easy transfers!
          </p>
        </div>
        {props.allowReinstall ? (
          <p className="text-muted-foreground text-sm text-center">
            Click <Link onClick={reinstallApp}>here</Link> if you want to
            re-install the app.
          </p>
        ) : (
          <div />
        )}
      </div>
    </PageContent>
  );
}

function CantInstallDesktop() {
  return (
    <PageContent>
      <div className="h-full flex flex-col justify-center">
        <div className="flex flex-col gap-4 text-center items-center">
          <Globe size={64} className="text-primary" />
          <span className="text-lg font-semibold">Welcome to smooth</span>
          <p className="text-muted-foreground text-sm">
            Open this page on your phone (in Chrome on Android, in Safari on
            iOS) to install the app.
          </p>
          <CopyText
            buttonLabel="Copy link"
            valueToCopy={window.location.href}
          />
        </div>
      </div>
    </PageContent>
  );
}

function BadMobileBrowser(props: { targetBrowser: string }) {
  return (
    <PageContent>
      <div className="h-full flex flex-col justify-center">
        <div className="flex flex-col gap-4 text-center items-center">
          <Globe size={64} className="text-primary" />
          <span className="text-lg font-semibold">Welcome to smooth</span>
          <p className="text-muted-foreground text-sm">
            Open this page in {props.targetBrowser} to install the app.
          </p>
          <CopyText
            buttonLabel="Copy link"
            valueToCopy={window.location.href}
          />
        </div>
      </div>
    </PageContent>
  );
}

/**
 * A screen to be displayed when smooth is opened in browser.
 *
 * @returns
 */
export function Install() {
  const posthog = usePostHog();
  const [, navigate] = useLocation();
  const pwaData = usePwa();
  const {
    canInstall,
    onInstall,
    installPrompt,
    wasInstalledNow,
    installedAsApk,
    installedAsShortcut,
    isStandalone,
    isMobile,
    mobileOS,
    isBadBrowser,
    isMobileSafari,
  } = pwaData;
  const [installing, setInstalling] = useState(false);
  const [showSafariInstructions, setShowSafariInstructions] = useState(false);

  useEffect(() => {
    posthog.capture("Installation config", {
      canInstall,
      installedAsApk,
      installedAsShortcut,
      isStandalone,
      isMobile,
      mobileOS,
      isBadBrowser,
      isMobileSafari,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posthog]); // we want to capture only one posthog event - upon the initial load

  useEffect(() => {
    if (isStandalone) {
      // Is already opened as an installed app.
      navigate("/");
    }
  }, [isStandalone, navigate]);

  const onUserChoiceMade = (choice: UserChoice) => {
    console.log(choice);
    if (choice === UserChoice.DISMISSED) {
      setInstalling(false);
      return;
    }

    // else - doing nothing. Waiting until the app installs.
  };

  const onInstallClicked = () => {
    setInstalling(true);
    installPrompt(onUserChoiceMade);
  };

  // Not always displayed, but computing here for simplicity
  const safariInstructionsDrawer = (
    <SafariInstructions
      showDrawer={showSafariInstructions}
      setShowDrawer={setShowSafariInstructions}
      onClickDone={() => {
        setShowSafariInstructions(false);
        onInstall();
      }}
    />
  );

  let content: JSX.Element;
  if (!isMobile) content = <CantInstallDesktop />;
  // All checks below assume this is a mobile device
  else if (installedAsApk || wasInstalledNow) content = <AppInstalled />;
  else if (installedAsShortcut) content = <AppInstalled allowReinstall />;
  else if (mobileOS === "iOS") {
    if (isMobileSafari)
      content = (
        <InstallPrompt
          onInstallClicked={() => setShowSafariInstructions(true)}
        />
      );
    // TODO: add installation instructions for Chrome on iOS.
    // In new iOS versions ppl can Add to Home Screen in Chrome too.
    else content = <BadMobileBrowser targetBrowser="Safari" />;
  }
  // Assuming it's android since it's not iOS (could be cringe like Windows Phone tho)
  else if (isBadBrowser)
    content = <BadMobileBrowser targetBrowser="Google Chrome" />;
  else if (canInstall) {
    if (installing) content = <Installing />;
    else content = <InstallPrompt onInstallClicked={onInstallClicked} />;
  } else content = <BadMobileBrowser targetBrowser="Google Chrome" />;

  return (
    <Page>
      <PageHeader>
        <span>
          smooth <span className="text-xs text-muted-foreground"> USDT</span>
        </span>
      </PageHeader>
      {content}
      {/* Passing the drawer always so that when the user closes it,
      it closes smoothly and doesn't get removed from the DOM immediately */}
      {safariInstructionsDrawer}
    </Page>
  );
}
