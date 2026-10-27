import "@/styles/globals.css";
import "react-toastify/dist/ReactToastify.css";
import type { AppProps } from "next/app";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "@/lib/AuthContext";
import { LanguageProvider } from "@/lib/LanguageContext";
import LanguageVerificationModal from "@/components/LanguageVerificationModal";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Stack Overflow Clone</title>
        <meta
          name="description"
          content="A full-featured Stack Overflow platform with community feed, subscription plans, rewards, and multi-language support."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AuthProvider>
        <LanguageProvider>
          <ToastContainer position="top-right" autoClose={3000} />
          <LanguageVerificationModal />
          <Component {...pageProps} />
        </LanguageProvider>
      </AuthProvider>
    </>
  );
}
