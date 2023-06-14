import Head from "next/head";
import { Button } from "~/components/ui/button";
import { DropdownAvatar } from "~/components/dropdown-avatar";
import { ReactElement } from "react";
import { GetServerSideProps } from "next";
import { getServerAuthSession } from "~/server/auth";
import DashboardLayout from "~/components/layouts/dashboard-layout";

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
  return (
    <>
      <div className="flex w-screen flex-col">
        <div className="flex h-24 w-full items-center justify-between border-b bg-white p-7">
          <div></div>

          <div className="flex gap-4">
            <Button>+ Add New Task</Button>
            <DropdownAvatar />
          </div>
        </div>
        <div className="flex h-screen flex-col items-center justify-center">
          <h1 className="heading-xl">Welcome back !</h1>
          <h2 className="heading-l text-medgray">
            Select the project you would like to work with to get started...
          </h2>
        </div>
      </div>
    </>
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
