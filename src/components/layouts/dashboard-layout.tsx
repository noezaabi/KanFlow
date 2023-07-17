import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { createContext, useState } from "react";
import { useDisclosure } from "~/hooks/useDisclosure";
import { api } from "~/utils/api";
import { CreateBoardDialog } from "../dialog/CreateBoardDialog";
import { DarkModeSwitch } from "../ui/switch";
import {
  DragDropContext,
  Draggable,
  DraggableRubric,
  DropResult,
  Droppable,
} from "react-beautiful-dnd";

interface Props {
  children: React.ReactNode;
}

export const SidebarContext = createContext(true);

const DashboardLayout: React.FC<Props> = ({ children }) => {
  const { systemTheme, theme, setTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const session = useSession();
  const { isOpen, onToggle } = useDisclosure();
  const [isSideBarCollapsed, setIsSideBarCollapsed] = useState(false);
  const router = useRouter();
  const route = router.query.id;
  const [boardsData, setBoardsData] = useState<typeof data>();
  const { mutate: reorderBoards } = api.board.reorderBoards.useMutation({
    onError: (err) => {
      console.log(err);
    },
  });

  const { data, isLoading } = api.board.getBoardByUserId.useQuery(
    {
      userId: session.data?.user.id || "",
    },
    {
      onSuccess: (data) => {
        setBoardsData(data);
      },
    }
  );
  console.log(currentTheme);

  if (isLoading || !boardsData) {
    return (
      <main className="grid w-screen grid-cols-5 grid-rows-1">
        <div
          className={` h-screen flex-col justify-between border-r bg-white py-8 transition-all dark:bg-darkgray ${
            isSideBarCollapsed ? "hidden" : "col-span-1 hidden md:flex"
          }`}
        >
          <div className={isSideBarCollapsed ? "hidden" : "block"}>
            <Link href="/dashboard">
              <Image
                src={
                  currentTheme === "light"
                    ? "/images/kanban-logo.svg"
                    : "/images/kanban-logo-dark.svg"
                }
                alt="KanFlow Logo"
                width={150}
                height={25}
                className="pl-8"
              />
            </Link>

            <div className="pt-14"></div>
          </div>
          <div
            className={`mx-6  flex-col ${
              isSideBarCollapsed ? "hidden" : "flex"
            }`}
          >
            <div className=" flex justify-center gap-6 rounded-md bg-background py-4">
              <Image
                src="/images/sun.svg"
                alt="Light mode indicator"
                width={20}
                height={20}
              />
              <DarkModeSwitch
                checked={currentTheme !== "dark"}
                onClick={() =>
                  currentTheme === "dark" ? setTheme("light") : setTheme("dark")
                }
              />
              <Image
                src="/images/moon.svg"
                alt="Dark mode indicator"
                width={20}
                height={20}
              />
            </div>

            <button
              className="mt-2 flex gap-2 py-4 hover:underline"
              onClick={() => setIsSideBarCollapsed(!isSideBarCollapsed)}
            >
              <Image
                src="/images/eye-slash.svg"
                alt="Hide icon"
                width={20}
                height={20}
              />
              <p className={"heading-m text-medgray"}> Hide Sidebar</p>
            </button>
          </div>
        </div>
        <button
          className={`absolute bottom-8 left-0 h-12 w-14 items-center justify-center rounded-r-full bg-primary ${
            !isSideBarCollapsed ? "hidden" : "flex"
          }`}
          onClick={() => setIsSideBarCollapsed(!isSideBarCollapsed)}
        >
          <svg
            fill="#ffffff"
            height="30px"
            width="30px"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            enableBackground="new 0 0 512 512"
            stroke="#ffffff"
            className="pr-1"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              {" "}
              <g>
                {" "}
                <path d="m494.8,241.4l-50.6-49.4c-50.1-48.9-116.9-75.8-188.2-75.8s-138.1,26.9-188.2,75.8l-50.6,49.4c-11.3,12.3-4.3,25.4 0,29.2l50.6,49.4c50.1,48.9 116.9,75.8 188.2,75.8s138.1-26.9 188.2-75.8l50.6-49.4c4-3.8 11.7-16.4 0-29.2zm-238.8,84.4c-38.5,0-69.8-31.3-69.8-69.8 0-38.5 31.3-69.8 69.8-69.8 38.5,0 69.8,31.3 69.8,69.8 0,38.5-31.3,69.8-69.8,69.8zm-195.3-69.8l35.7-34.8c27-26.4 59.8-45.2 95.7-55.4-28.2,20.1-46.6,53-46.6,90.1 0,37.1 18.4,70.1 46.6,90.1-35.9-10.2-68.7-29-95.7-55.3l-35.7-34.7zm355,34.8c-27,26.3-59.8,45.1-95.7,55.3 28.2-20.1 46.6-53 46.6-90.1 0-37.2-18.4-70.1-46.6-90.1 35.9,10.2 68.7,29 95.7,55.4l35.6,34.8-35.6,34.7z"></path>{" "}
              </g>{" "}
            </g>
          </svg>
        </button>
        <SidebarContext.Provider value={isSideBarCollapsed}>
          {children}
        </SidebarContext.Provider>
      </main>
    );
  }

  const onDragEnd = (result: DropResult): void => {
    if (!result.destination) {
      return;
    }

    const boards = Array.from(boardsData);
    const [reorderedBoard] = boards.splice(result.source.index, 1);
    boards.splice(result.destination.index, 0, reorderedBoard!);

    boards.map((board, index) => {
      board.order = index;
    });

    setBoardsData(boards);

    reorderBoards({
      boards,
    });
  };

  return (
    <main className="grid w-screen grid-cols-5 grid-rows-1">
      <div
        className={` h-screen flex-col justify-between border-r bg-white py-8 transition-all dark:bg-darkgray ${
          isSideBarCollapsed ? "hidden" : "col-span-1 hidden md:flex"
        }`}
      >
        <div className={isSideBarCollapsed ? "hidden" : "block"}>
          <Link href="/dashboard">
            <Image
              src={
                currentTheme === "light"
                  ? "/images/kanban-logo.svg"
                  : "/images/kanban-logo-dark.svg"
              }
              alt="KanFlow Logo"
              width={150}
              height={25}
              className="pl-8"
            />
          </Link>

          <div className="pt-14">
            <p className="heading-sm pl-8">
              {boardsData.length
                ? `ALL BOARDS (${boardsData.length})`
                : `ALL BOARDS`}
            </p>
            <div className="mt-5 flex flex-col">
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="board">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {boardsData.map((board, index) => (
                        <Draggable
                          key={board.id}
                          index={index}
                          draggableId={board.id}
                        >
                          {(provided) => (
                            <div
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              ref={provided.innerRef}
                            >
                              <BoardOption
                                isActive={route === board.id}
                                boardName={board.title}
                                link={`/dashboard/${board.id}`}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {/* <BoardOption
                isActive={route === "platform-launch"}
                boardName="Platform Launch"
                link="/dashboard/platform-launch"
              />
              <BoardOption
                isActive={route === "marketing-plan"}
                boardName="Marketing Plan"
                link="/dashboard/marketing-plan"
              />
              <BoardOption
                isActive={route === "roadmap"}
                boardName="Roadmap"
                link="/dashboard/roadmap"
              /> */}

              <CreateBoardDialog isOpen={isOpen} onToggle={onToggle} />

              <button
                onClick={() => {
                  onToggle();
                }}
                className={
                  "mr-6 flex rounded-r-full bg-white py-4 hover:bg-slate-100 dark:bg-darkgray"
                }
              >
                <svg
                  className="ml-8 mt-0.5"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0.846133 0.846133C0.304363 1.3879 0 2.12271 0 2.88889V13.1111C0 13.8773 0.304363 14.6121 0.846133 15.1538C1.3879 15.6957 2.12271 16 2.88889 16H13.1111C13.8773 16 14.6121 15.6957 15.1538 15.1538C15.6957 14.6121 16 13.8773 16 13.1111V2.88889C16 2.12271 15.6957 1.3879 15.1538 0.846133C14.6121 0.304363 13.8773 0 13.1111 0H2.88889C2.12271 0 1.3879 0.304363 0.846133 0.846133ZM1.33333 13.1111V8.44448H9.77781V14.6667H2.88889C2.03022 14.6667 1.33333 13.9698 1.33333 13.1111ZM9.77781 7.11111V1.33333H2.88889C2.47633 1.33333 2.08067 1.49723 1.78895 1.78895C1.49723 2.08067 1.33333 2.47633 1.33333 2.88889V7.11111H9.77781ZM11.1111 5.77778H14.6667V10.2222H11.1111V5.77778ZM14.6667 11.5555H11.1111V14.6667H13.1111C13.5236 14.6667 13.9194 14.5028 14.2111 14.2111C14.5028 13.9194 14.6667 13.5236 14.6667 13.1111V11.5555ZM14.6667 2.88889V4.44445H11.1111V1.33333H13.1111C13.5236 1.33333 13.9194 1.49723 14.2111 1.78895C14.5028 2.08067 14.6667 2.47633 14.6667 2.88889Z"
                    fill="#635FC7"
                  />
                </svg>

                <p className={"heading-m ml-4 text-purple"}>
                  + Create New Board
                </p>
              </button>
            </div>
          </div>
        </div>
        <div
          className={`mx-6  flex-col ${isSideBarCollapsed ? "hidden" : "flex"}`}
        >
          <div className=" flex justify-center gap-6 rounded-md bg-background py-4">
            <Image
              src="/images/sun.svg"
              alt="Light mode indicator"
              width={20}
              height={20}
            />
            <DarkModeSwitch
              checked={theme === "dark"}
              onClick={() =>
                theme == "dark" ? setTheme("light") : setTheme("dark")
              }
            />
            <Image
              src="/images/moon.svg"
              alt="Dark mode indicator"
              width={20}
              height={20}
            />
          </div>

          <button
            className="mt-2 flex gap-2 py-4 hover:underline"
            onClick={() => setIsSideBarCollapsed(!isSideBarCollapsed)}
          >
            <Image
              src="/images/eye-slash.svg"
              alt="Hide icon"
              width={20}
              height={20}
            />
            <p className={"heading-m text-medgray"}> Hide Sidebar</p>
          </button>
        </div>
      </div>
      <button
        className={`absolute bottom-8 left-0 h-12 w-14 items-center justify-center rounded-r-full bg-primary ${
          !isSideBarCollapsed ? "hidden" : "flex"
        }`}
        onClick={() => setIsSideBarCollapsed(!isSideBarCollapsed)}
      >
        <svg
          fill="#ffffff"
          height="30px"
          width="30px"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          enableBackground="new 0 0 512 512"
          stroke="#ffffff"
          className="pr-1"
        >
          <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
          <g
            id="SVGRepo_tracerCarrier"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></g>
          <g id="SVGRepo_iconCarrier">
            {" "}
            <g>
              {" "}
              <path d="m494.8,241.4l-50.6-49.4c-50.1-48.9-116.9-75.8-188.2-75.8s-138.1,26.9-188.2,75.8l-50.6,49.4c-11.3,12.3-4.3,25.4 0,29.2l50.6,49.4c50.1,48.9 116.9,75.8 188.2,75.8s138.1-26.9 188.2-75.8l50.6-49.4c4-3.8 11.7-16.4 0-29.2zm-238.8,84.4c-38.5,0-69.8-31.3-69.8-69.8 0-38.5 31.3-69.8 69.8-69.8 38.5,0 69.8,31.3 69.8,69.8 0,38.5-31.3,69.8-69.8,69.8zm-195.3-69.8l35.7-34.8c27-26.4 59.8-45.2 95.7-55.4-28.2,20.1-46.6,53-46.6,90.1 0,37.1 18.4,70.1 46.6,90.1-35.9-10.2-68.7-29-95.7-55.3l-35.7-34.7zm355,34.8c-27,26.3-59.8,45.1-95.7,55.3 28.2-20.1 46.6-53 46.6-90.1 0-37.2-18.4-70.1-46.6-90.1 35.9,10.2 68.7,29 95.7,55.4l35.6,34.8-35.6,34.7z"></path>{" "}
            </g>{" "}
          </g>
        </svg>
      </button>
      <SidebarContext.Provider value={isSideBarCollapsed}>
        {children}
      </SidebarContext.Provider>
    </main>
  );
};

const BoardOption = (props: {
  isActive: boolean;
  boardName: string;
  link: string;
}) => {
  const { isActive, boardName, link } = props;

  return (
    <Link href={link}>
      <div
        className={` mr-6 flex h-14 justify-between rounded-r-full ${
          isActive
            ? "bg-primary"
            : "bg-white hover:bg-slate-100 dark:bg-darkgray"
        } py-4`}
      >
        <div className="flex ">
          <svg
            className="ml-8 mt-0.5"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M0.846133 0.846133C0.304363 1.3879 0 2.12271 0 2.88889V13.1111C0 13.8773 0.304363 14.6121 0.846133 15.1538C1.3879 15.6957 2.12271 16 2.88889 16H13.1111C13.8773 16 14.6121 15.6957 15.1538 15.1538C15.6957 14.6121 16 13.8773 16 13.1111V2.88889C16 2.12271 15.6957 1.3879 15.1538 0.846133C14.6121 0.304363 13.8773 0 13.1111 0H2.88889C2.12271 0 1.3879 0.304363 0.846133 0.846133ZM1.33333 13.1111V8.44448H9.77781V14.6667H2.88889C2.03022 14.6667 1.33333 13.9698 1.33333 13.1111ZM9.77781 7.11111V1.33333H2.88889C2.47633 1.33333 2.08067 1.49723 1.78895 1.78895C1.49723 2.08067 1.33333 2.47633 1.33333 2.88889V7.11111H9.77781ZM11.1111 5.77778H14.6667V10.2222H11.1111V5.77778ZM14.6667 11.5555H11.1111V14.6667H13.1111C13.5236 14.6667 13.9194 14.5028 14.2111 14.2111C14.5028 13.9194 14.6667 13.5236 14.6667 13.1111V11.5555ZM14.6667 2.88889V4.44445H11.1111V1.33333H13.1111C13.5236 1.33333 13.9194 1.49723 14.2111 1.78895C14.5028 2.08067 14.6667 2.47633 14.6667 2.88889Z"
              fill={isActive ? "white" : "#828FA3"}
            />
          </svg>

          <p
            className={`heading-m ml-4  ${
              isActive ? "text-white" : "text-medgray"
            }`}
          >
            {props.boardName}
          </p>
        </div>
      </div>
    </Link>

    //
  );
};

export default DashboardLayout;
