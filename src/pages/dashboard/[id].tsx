import Head from "next/head";
import { Button } from "~/components/ui/button";
import { DropdownAvatar } from "~/components/dropdown-avatar";
import { ReactElement } from "react";
import { GetServerSideProps } from "next";
import { getServerAuthSession } from "~/server/auth";
import DashboardLayout from "~/components/layouts/dashboard-layout";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { Icons } from "~/components/icons";
import { Skeleton } from "~/components/ui/skeleton";

Board.getLayout = function getLayout(page: ReactElement) {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{`Kanflow - ${router.query.id} Board`}</title>
      </Head>
      <main className="flex h-screen w-screen ">
        <DashboardLayout route={`${router.query.id}`}>{page}</DashboardLayout>
      </main>
    </>
  );
};

export default function Board(props: { boardId: string }) {
  const { boardId } = props;

  const { data, isLoading } = api.board.getBoardById.useQuery({
    boardId: boardId,
  });

  if (isLoading) {
    return (
      <div className="flex w-screen flex-col">
        <div className="flex h-24 w-full items-center justify-between border-b bg-white p-7">
          {/* <Skeleton className="w-10h-4 h-6 w-96" /> */}
          <div></div>
          <div className="flex gap-4">
            <Button>+ Add New Task</Button>
            <DropdownAvatar />
          </div>
        </div>
        <div className="flex h-screen flex-col items-center justify-center">
          <Icons.spinner className="animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) {
    return <div>Board not found</div>;
  }

  return (
    <>
      <div className="flex w-screen flex-col">
        <div className="flex h-24 w-full items-center justify-between border-b bg-white p-7">
          <h1 className="heading-xl">{data.title}</h1>
          <div className="flex gap-4">
            <Button>+ Add New Task</Button>
            <DropdownAvatar />
          </div>
        </div>
        <div className="flex h-screen flex-col items-center justify-center"></div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req, res, params } = ctx;
  const id = params?.id;

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
    props: {
      boardId: id,
    },
  };
};
