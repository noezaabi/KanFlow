import Head from "next/head";
import { Button } from "~/components/ui/button";
import { DropdownAvatar } from "~/components/dropdown-avatar";
import { ReactElement } from "react";
import { GetServerSideProps } from "next";
import { getServerAuthSession } from "~/server/auth";
import DashboardLayout from "~/components/layouts/dashboard-layout";
import { useRouter } from "next/router";

Board.getLayout = function getLayout(page: ReactElement) {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{`Kanflow - ${router.query.board} Board`}</title>
      </Head>
      <main className="flex h-screen w-screen ">
        <DashboardLayout route={`${router.query.board}`}>page</DashboardLayout>
        {page}
      </main>
    </>
  );
};

export default function Board() {
  const router = useRouter();
  return (
    <>
      <div className="flex w-screen flex-col">
        <div className="flex h-24 w-full items-center justify-between border-b bg-white p-7">
          <h1 className="heading-xl">{router.query.board}</h1>

          <div className="flex gap-4">
            <Button>+ Add New Task</Button>
            <DropdownAvatar />
          </div>
        </div>
        <div className="flex h-screen flex-col items-center justify-center bg-yellow-400"></div>
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
