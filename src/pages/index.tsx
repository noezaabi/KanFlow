import { type NextPage } from "next";
import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import { DropdownAvatar } from "~/components/dropdown-avatar";
import { Button } from "~/components/ui/button";
import { DarkModeSwitch } from "~/components/ui/switch";
import { api } from "~/utils/api";

const BoardOption = (props: { isActive: boolean; boardName: string }) => {
  const { isActive, boardName } = props;

  return (
    <button
      className={`mr-6 flex rounded-r-full   ${
        isActive ? "bg-primary" : "bg-white hover:bg-slate-100"
      } py-4`}
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
          fill-rule="evenodd"
          clip-rule="evenodd"
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
    </button>
  );
};

const AddBoard = () => {
  return (
    <button
      className={"mr-6 flex rounded-r-full bg-white py-4 hover:bg-slate-100"}
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
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M0.846133 0.846133C0.304363 1.3879 0 2.12271 0 2.88889V13.1111C0 13.8773 0.304363 14.6121 0.846133 15.1538C1.3879 15.6957 2.12271 16 2.88889 16H13.1111C13.8773 16 14.6121 15.6957 15.1538 15.1538C15.6957 14.6121 16 13.8773 16 13.1111V2.88889C16 2.12271 15.6957 1.3879 15.1538 0.846133C14.6121 0.304363 13.8773 0 13.1111 0H2.88889C2.12271 0 1.3879 0.304363 0.846133 0.846133ZM1.33333 13.1111V8.44448H9.77781V14.6667H2.88889C2.03022 14.6667 1.33333 13.9698 1.33333 13.1111ZM9.77781 7.11111V1.33333H2.88889C2.47633 1.33333 2.08067 1.49723 1.78895 1.78895C1.49723 2.08067 1.33333 2.47633 1.33333 2.88889V7.11111H9.77781ZM11.1111 5.77778H14.6667V10.2222H11.1111V5.77778ZM14.6667 11.5555H11.1111V14.6667H13.1111C13.5236 14.6667 13.9194 14.5028 14.2111 14.2111C14.5028 13.9194 14.6667 13.5236 14.6667 13.1111V11.5555ZM14.6667 2.88889V4.44445H11.1111V1.33333H13.1111C13.5236 1.33333 13.9194 1.49723 14.2111 1.78895C14.5028 2.08067 14.6667 2.47633 14.6667 2.88889Z"
          fill="#635FC7"
        />
      </svg>

      <p className={"heading-m ml-4 text-purple"}>+ Create New Board</p>
    </button>
  );
};

const SideMenu = () => {
  return (
    <div className="hidden h-screen flex-col justify-between border-r bg-white py-8 md:flex md:w-80">
      <div className=" ">
        <Image
          src="/images/kanban-logo.svg"
          alt="KanFlow Logo"
          width={150}
          height={25}
          className="pl-8"
        />
        <div className="pt-14">
          <p className="heading-sm pl-8">ALL BOARDS (3)</p>
          <div className="mt-5 flex flex-col">
            <BoardOption isActive={true} boardName="Platform Launch" />
            <BoardOption isActive={false} boardName="Marketing Plan" />
            <BoardOption isActive={false} boardName="Roadmap" />
            <AddBoard />
          </div>
        </div>
      </div>
      <div className="mx-6 flex flex-col">
        <div className=" flex justify-center gap-6 rounded-md bg-background py-4">
          <Image
            src="/images/sun.svg"
            alt="Light mode indicator"
            width={20}
            height={20}
          />
          <DarkModeSwitch />
          <Image
            src="/images/moon.svg"
            alt="Dark mode indicator"
            width={20}
            height={20}
          />
        </div>
        <button className="mt-2 flex gap-2 py-4 hover:underline">
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
  );
};

const Home: NextPage = () => {
  const { data: sessionData } = useSession();
  return (
    <>
      <Head>
        <title>KanFlow</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen w-screen ">
        <SideMenu />
        <div className="flex w-screen flex-col">
          <div className="flex h-24 w-full items-center justify-between border-b bg-white p-7">
            <h1 className="heading-xl">Platform Launch</h1>

            <div className="flex gap-4">
              <Button>+ Add New Task</Button>
              <DropdownAvatar />
            </div>
          </div>
          <div className="flex h-screen items-center justify-center">
            {!sessionData && (
              <h1 className="heading-xl">
                Welcome, please sign in to start using KanFlow!
              </h1>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;

const AuthShowcase: React.FC = () => {
  const { data: sessionData } = useSession();

  const { data: secretMessage } = api.example.getSecretMessage.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined }
  );

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-white">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
        {secretMessage && <span> - {secretMessage}</span>}
      </p>
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
};
