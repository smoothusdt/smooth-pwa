import { usePrivy } from "@privy-io/react-auth";
import { Page, PageContent, PageHeader } from "./Page";
import { Button } from "./ui/button";
import { useLocation } from "wouter";

export function Welcome() {
    const { login } = usePrivy();
    const [_, navigate] = useLocation();

    return (
        <Page>
            <PageHeader>
                <span>
                    smooth <span className="text-xs text-muted-foreground"> USDT</span>
                </span>
            </PageHeader>
            <PageContent>
                <div className="h-full flex flex-col items-center justify-center gap-4">
                    <p className="text-2xl text-center">Welcome to Smooth USDT</p>
                    <Button onClick={() => navigate("/sign-up")} className="w-full">Sign Up</Button>
                    <Button onClick={login} className="w-full" variant="secondary">Log In</Button>
                    <span className="text-xs text-muted-foreground font-light text-center">
                        By continuing you agree to the Smooth USDT{" "}
                        <Button onClick={() => window.location.pathname = "/terms-of-use"} variant="link" className="text-xs font-light p-0">
                            Terms of Use
                        </Button>
                    </span>
                </div>
            </PageContent>
        </Page>
    );
}