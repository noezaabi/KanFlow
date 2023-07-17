import { Subtask, Task, Board, Column } from "@prisma/client";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { ReactElement, useContext, useEffect, useState } from "react";
import {
  DragDropContext,
  Draggable,
  DropResult,
  Droppable,
} from "react-beautiful-dnd";
import { set } from "zod";
import { CreateColumnDialog } from "~/components/dialog/CreateColumnDialog";
import { CreateTaskDialog } from "~/components/dialog/CreateTaskDialog";
import { EditBoardDialog } from "~/components/dialog/EditBoardDialog";
import { TaskDialog } from "~/components/dialog/TaskDialog";
import { DropdownAvatar } from "~/components/dropdown-avatar";
import { Icons } from "~/components/icons";
import DashboardLayout, {
  SidebarContext,
} from "~/components/layouts/dashboard-layout";
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
import type { editBoardFormSchema } from "~/const/form-validation-schema";

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
  const router = useRouter();
  const { boardId } = props;
  const { isOpen: isOpenColumn, onToggle: onToggleColumn } = useDisclosure();
  const { isOpen: isOpenCreateTask, onToggle: onToggleCreateTask } =
    useDisclosure();
  const { isOpen: isOpenTask, onToggle: onToggleTask } = useDisclosure();
  const { isOpen: isOpenEditBoard, onToggle: onToggleEditBoard } =
    useDisclosure();
  const [taskDialogData, setTaskDialogData] = useState<
    Task & {
      subtasks: Subtask[];
    }
  >({
    id: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
    order: 0,
    title: "Task 1",
    description: "Task 1 description",
    columnId: "1",
    subtasks: [
      {
        id: "1",
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        title: "Subtask 1",
        done: false,
        taskId: "1",
      },
    ],
  });
  const [dialogKey, setDialogKey] = useState<number>(Math.random());
  const isSideBarCollapsed = useContext(SidebarContext);
  // This Hook ensure we reload the editBoardDialog everytime we change the board we are looking at. If we didn't do this the
  // form inside the default values inside the components wouldn't update
  useEffect(() => {
    setDialogKey(Math.random());
  }, [router.asPath]);

  const [boardData, setBoardData] = useState<typeof data>();

  const { data, isLoading } = api.board.getBoardById.useQuery(
    {
      boardId: boardId,
    },
    {
      onSuccess: (data) => {
        setBoardData(data);
      },
    }
  );

  const { mutate: reorderTasks } = api.board.reorderTasks.useMutation({
    onError: (err) => {
      console.log(err);
    },
  });

  const { mutate: reorderColumns } = api.board.reorderColumns.useMutation({
    onSuccess() {
      console.log("reorderColumns success");
    },
    onError: (err) => {
      console.log(err);
    },
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

  if (!data || !boardData) {
    return <div>Board not found</div>;
  }

  const onDragEnd = (result: DropResult): void => {
    const { destination, source, draggableId, type } = result;

    // Make sure there is a destination
    if (!destination) {
      return;
    }

    // Make sure the user didn't drop the item in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Handle the column logic
    if (type === "column") {
      const newColumns = Array.from(boardData.columns);
      const [removed] = newColumns.splice(source.index, 1);
      if (!removed) {
        throw new Error("Column not found");
      }
      removed.order = destination.index;
      newColumns.splice(destination.index, 0, removed);

      for (let i = 0; i < newColumns.length; i++) {
        newColumns[i]!.order = i;
      }

      const newBoardData = {
        ...boardData,
        columns: newColumns,
      };

      setBoardData(newBoardData);

      reorderColumns({
        columns: newColumns.map((col) => ({
          id: col.id,
          order: col.order,
        })),
      });

      return;
    }

    // find the column the user is dragging from
    const originColumn = boardData.columns.find(
      (col) => col.id === source.droppableId
    );

    // find the column the user is dragging to
    const destinationColumn = boardData.columns.find(
      (col) => col.id === destination.droppableId
    );

    if (!originColumn || !destinationColumn) {
      throw new Error("Column not found");
    }

    // remove the task from the origin column
    const [task] = originColumn.tasks.splice(source.index, 1);

    if (!task) {
      throw new Error("Task not found");
    }

    task.columnId = destinationColumn.id;

    // add the task to the destination column
    destinationColumn.tasks.splice(destination.index, 0, task);

    // update the order of the tasks in the origin column
    for (let i = 0; i < originColumn.tasks.length; i++) {
      originColumn.tasks[i]!.order = i;
    }

    if (destinationColumn.id !== originColumn.id) {
      // update the order of the tasks in the destination column
      for (let i = 0; i < destinationColumn.tasks.length; i++) {
        destinationColumn.tasks[i]!.order = i;
      }
    }

    // add the updated columns to the board data
    const newBoardData = {
      ...boardData,
      columns: boardData.columns.map((col) => {
        if (col.id === originColumn.id) {
          return originColumn;
        } else if (col.id === destinationColumn.id) {
          return destinationColumn;
        } else {
          return col;
        }
      }),
    };

    newBoardData ?? setBoardData(newBoardData);

    // Reorder the tasks in the database
    reorderTasks({
      columnId: originColumn.id,
      tasks: originColumn.tasks.map((task) => ({
        order: task.order,
        id: task.id,
      })),
    });
    reorderTasks({
      columnId: destinationColumn.id,
      tasks: destinationColumn.tasks.map((task) => ({
        order: task.order,
        id: task.id,
      })),
    });
  };

  return (
    <div
      className={`grid h-screen grid-rows-11 ${
        isSideBarCollapsed ? "col-span-5" : "col-span-4"
      }`}
    >
      <div className="row-span-1 flex items-center justify-between border-b bg-white p-7 dark:bg-darkgray">
        <div className="flex gap-4">
          <button
            onClick={() => {
              onToggleEditBoard();
            }}
          >
            <h1 className="heading-xl dark:text-white">{data.title}</h1>
          </button>
        </div>

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
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable
          droppableId="all-columns"
          direction="horizontal"
          type="column"
        >
          {(provided) => {
            return (
              <div
                className="row-span-10 flex  overflow-auto overscroll-none p-6"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {boardData.columns.map((col, col_idx) => (
                  // column
                  <Draggable draggableId={col.id} index={col_idx} key={col.id}>
                    {(provided) => {
                      return (
                        <div
                          className=" flex w-80 shrink-0 flex-col"
                          {...provided.draggableProps}
                          ref={provided.innerRef}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="mx-3 flex cursor-grab gap-3"
                          >
                            <div
                              className={`h-5 w-5  rounded-full`}
                              style={{ backgroundColor: `#${col.color}` }}
                            />
                            <p className="heading-sm mt-0.5  uppercase">{`${col.title} (${col.tasks.length})`}</p>
                          </div>
                          <Droppable droppableId={col.id} type="task">
                            {(provided) => (
                              <div
                                className="mx-3 mt-2 flex h-full flex-col"
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                              >
                                {col.tasks.map((task, index) => (
                                  <Draggable
                                    draggableId={task.id}
                                    index={index}
                                    key={task.id}
                                  >
                                    {(provided) => (
                                      <Card
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        ref={provided.innerRef}
                                        className="mt-5 cursor-pointer shadow-md"
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
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      );
                    }}
                  </Draggable>
                ))}

                {/* <Card
                  onClick={() => {
                    onToggleColumn();
                  }}
                  className="mt-11 flex h-[90%]
                  cursor-pointer items-center justify-center bg-[#E9EFFA]"
                >
                  <h1 className="heading-lg w-72 text-center text-medgray">
                    + Add Column
                  </h1>
                </Card> */}
                {provided.placeholder}
                <CreateColumnDialog
                  isOpen={isOpenColumn}
                  onToggle={onToggleColumn}
                  boardId={boardData.id}
                />
                <CreateTaskDialog
                  isOpen={isOpenCreateTask}
                  onToggle={onToggleCreateTask}
                  boardData={boardData}
                />
                <TaskDialog
                  isOpen={isOpenTask}
                  onToggle={onToggleTask}
                  task={taskDialogData}
                  columns={boardData.columns.map((col) => ({
                    id: col.id,
                    title: col.title,
                  }))}
                />
                <EditBoardDialog
                  key={dialogKey}
                  isOpen={isOpenEditBoard}
                  onToggle={onToggleEditBoard}
                  board={boardData}
                  setKey={setDialogKey}
                />
              </div>
            );
          }}
        </Droppable>
      </DragDropContext>
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
