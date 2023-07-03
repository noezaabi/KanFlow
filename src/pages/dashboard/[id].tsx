import { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { ReactElement, useContext, useState } from "react";
import { CreateColumnDialog } from "~/components/dialog/CreateColumnDialog";
import { CreateTaskDialog } from "~/components/dialog/CreateTaskDialog";
import { DropdownAvatar } from "~/components/dropdown-avatar";
import { Icons } from "~/components/icons";
import DashboardLayout from "~/components/layouts/dashboard-layout";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useDisclosure } from "~/hooks/useDisclosure";
import { getServerAuthSession } from "~/server/auth";
import { api } from "~/utils/api";
import { SidebarContext } from "~/components/layouts/dashboard-layout";
import { TaskDialog } from "~/components/dialog/TaskDialog";
import { Subtask, Task } from "@prisma/client";
import { set } from "zod";

Board.getLayout = function getLayout(page: ReactElement) {
  return (
    <>
      <Head>
        <title>{`Kanflow Board`}</title>
      </Head>
      <DashboardLayout>{page}</DashboardLayout>
    </>
  );
};

export default function Board(props: { boardId: string }) {
  const { boardId } = props;
  const { isOpen: isOpenColumn, onToggle: onToggleColumn } = useDisclosure();
  const { isOpen: isOpenCreateTask, onToggle: onToggleCreateTask } =
    useDisclosure();
  const { isOpen: isOpenTask, onToggle: onToggleTask } = useDisclosure();
  const [taskDialogData, setTaskDialogData] = useState<
    Task & {
      subtasks: Subtask[];
    }
  >({
    id: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
    title: "Task 1",
    description: "Task 1 description",
    columnId: "1",
    subtasks: [
      {
        id: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        title: "Subtask 1",
        done: false,
        taskId: "1",
      },
    ],
  });
  const isSideBarCollapsed = useContext(SidebarContext);

  const { data, isLoading } = api.board.getBoardById.useQuery({
    boardId: boardId,
  });

  if (isLoading) {
    return (
      <div className="flex w-screen flex-col">
        <div className="flex h-24 w-full items-center justify-between border-b bg-white p-7 dark:bg-darkgray">
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

  // loop over columns

  return (
    <div
      className={`grid h-screen grid-rows-11 ${
        isSideBarCollapsed ? "col-span-5" : "col-span-4"
      }`}
    >
      <div className="row-span-1 flex items-center justify-between border-b bg-white p-7 dark:bg-darkgray">
        <h1 className="heading-xl dark:text-white">{data.title}</h1>
        <div className="flex gap-4">
          <Button
            onClick={() => {
              onToggleCreateTask();
            }}
          >
            + Add New Task
          </Button>
          <DropdownAvatar />
        </div>
      </div>
      <div className="row-span-10 flex gap-6 overflow-auto overscroll-none p-6">
        {data.columns.map((col) => (
          // column
          <div key={col.id} className="flex w-80 shrink-0 flex-col">
            <div className="flex gap-3">
              <div
                className={`h-5 w-5 rounded-full`}
                style={{ backgroundColor: `#${col.color}` }}
              ></div>
              <p className="heading-sm mt-0.5 uppercase">{`${col.title} (${col.tasks.length})`}</p>
            </div>
            <div className="mt-6 flex flex-col gap-5">
              {col.tasks.map((task, index) => (
                <Card
                  key={task.id}
                  className="cursor-pointer shadow-md"
                  onClick={() => {
                    setTaskDialogData(task);
                    onToggleTask();
                  }}
                >
                  <CardHeader>
                    <CardTitle>{task.title}</CardTitle>
                    <CardDescription>{`${task.subtasks.length} subtasks`}</CardDescription>
                  </CardHeader>
                </Card>
              ))}

              {/* {col.tasks.length > 0 ? (
                col.tasks.map((task) => (
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle>{task.title}</CardTitle>
                      <CardDescription>{`${task.subtasks.length} subtasks`}</CardDescription>
                    </CardHeader>
                  </Card>
                ))
              ) : (
                <Card className="flex h-24 cursor-pointer items-center justify-center bg-[#E9EFFA]">
                  <h1 className="heading-lg w-72 text-center text-medgray">
                    + New Task
                  </h1>
                </Card>
              )} */}
            </div>
          </div>
        ))}

        <Card
          onClick={() => {
            onToggleColumn();
          }}
          className="mt-11 flex h-[90%]
           cursor-pointer items-center justify-center bg-[#E9EFFA]"
        >
          <h1 className="heading-lg w-72 text-center text-medgray">
            + Add Column
          </h1>
        </Card>
        <CreateColumnDialog
          isOpen={isOpenColumn}
          onToggle={onToggleColumn}
          boardId={data.id}
        />
        <CreateTaskDialog
          isOpen={isOpenCreateTask}
          onToggle={onToggleCreateTask}
          boardData={data}
        />
        <TaskDialog
          isOpen={isOpenTask}
          onToggle={onToggleTask}
          task={taskDialogData}
          columns={data.columns.map((col) => ({
            id: col.id,
            title: col.title,
          }))}
        />
      </div>
    </div>
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
