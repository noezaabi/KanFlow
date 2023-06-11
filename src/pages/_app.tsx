import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { AppProps, type AppType } from "next/app";
import { api } from "~/utils/api";
import "~/styles/globals.css";

import { Plus_Jakarta_Sans } from "next/font/google";
import { NextComponentType, NextPage } from "next";
import { ReactElement, ReactNode } from "react";
import { AppContextType, AppInitialProps } from "next/dist/shared/lib/utils";

const pjs = Plus_Jakarta_Sans({ subsets: ["latin"] });

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsTypeWithLayout<P> = AppInitialProps<P> & {
  Component: NextPageWithLayout;
};

type AppTypeWithLayout<P = NonNullable<unknown>> = NextComponentType<
  AppContextType,
  P,
  AppPropsTypeWithLayout<P>
>;

const MyApp: AppTypeWithLayout<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const getLayout = Component.getLayout || ((page) => page);
  return (
    <main className={pjs.className}>
      <SessionProvider session={session}>
        {getLayout(<Component {...pageProps} />)}
      </SessionProvider>
    </main>
  );
};

export default api.withTRPC(MyApp);
