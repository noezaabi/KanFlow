import Head from "next/head";
import { Button } from "~/components/ui/button";
import { DropdownAvatar } from "~/components/dropdown-avatar";
import { ReactElement, useContext } from "react";
import { GetServerSideProps } from "next";
import { getServerAuthSession } from "~/server/auth";
import DashboardLayout, {
  SidebarContext,
} from "~/components/layouts/dashboard-layout";

Dashboard.getLayout = function getLayout(page: ReactElement) {
  return (
    <>
      <Head>
        <title>Inbox</title>
      </Head>
      <main className="flex h-screen w-screen ">
        <DashboardLayout route="/">{page}</DashboardLayout>
      </main>
    </>
  );
};

export default function Dashboard() {
  const isSideBarCollapsed = useContext(SidebarContext);
  return (
    <div
      className={`grid h-screen grid-rows-11 ${
        isSideBarCollapsed ? "col-span-5" : "col-span-4"
      }`}
    >
      <div className="row-span-1 flex items-center justify-between border-b bg-white p-7 dark:bg-darkgray">
        <div></div>
        <div className="flex gap-4">
          <DropdownAvatar />
        </div>
      </div>
      <div className="row-span-10  flex flex-col items-center justify-center overflow-auto overscroll-none p-6">
        <h1 className="heading-xl">Welcome back !</h1>
        <h2 className="heading-l text-medgray">
          Select the project you would like to work with to get started...
        </h2>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getServerAuthSession({ req, res });
  if (!session) {
    return {
      redirect: {
        destination: "/auth/signin",
        permanent: false,
      },
    };
  }
  return {
    props: {},
  };
};
