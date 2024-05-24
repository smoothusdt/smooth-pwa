import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { DeleteWalletButton } from "@/components/DeleteWalletButton";
import { LanguageSwitch } from "@/components/LanguageSwitch";

import { useWallet } from "@/hooks/useWallet";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

/** Full page component for displaying all the settings of Smooth USDT PWA */
export const Settings = () => {
  const [, navigate] = useLocation();
  const { connected } = useWallet();
  const { t } = useTranslation();

  // The user wallet is not set up or the user has deleted their wallet.
  // Cant do anything on this screen.
  useEffect(() => {
    if (!connected) navigate("/");
  }, [connected, navigate]);

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <span>{t("colorTheme")}</span>
        <ThemeSwitch />
      </div>
      <div className="flex justify-between items-center">
        <span>{t("language")}</span>
        <LanguageSwitch />
      </div>
      <Button variant="secondary" onClick={() => navigate("/backup/start")}>
        {t("backupSecretPhrase")}
      </Button>
      <DeleteWalletButton />
    </div>
  );
};