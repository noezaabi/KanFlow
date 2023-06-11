import { GetServerSidePropsContext, type NextPage } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";

const Home: NextPage = () => {
  return <></>;
};

export default Home;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return { redirect: { destination: "/auth/signin", permanent: false } };
  } else {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }
}
