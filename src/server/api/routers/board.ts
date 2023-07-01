import { z } from "zod";
import {
  createBoardFormSchema,
  createColumnFormSchema,
  createTaskFormSchema,
} from "~/const/form-validation-schema";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const boardRouter = createTRPCRouter({
  // createBoard using the input createBoardFormSchema
  createBoard: protectedProcedure
    .input(createBoardFormSchema)
    .mutation(async ({ ctx, input }) => {
      const board = await ctx.prisma.board.create({
        data: {
          title: input.title,
          columns: {
            create: input.columns.map((column) => ({
              title: column.title,
              color: Math.floor(Math.random() * 16777215).toString(16),
              tasks: {
                create: [],
              },
            })),
          },
          user: {
            connect: {
              id: ctx.session.user.id,
            },
          },
        },
      });
    }),

  // createColumn using the input createColumnFormSchema and a boardId
  createColumn: protectedProcedure
    .input(z.object({ boardId: z.string(), column: createColumnFormSchema }))
    .mutation(async ({ ctx, input }) => {
      const board = await ctx.prisma.board.update({
        where: {
          id: input.boardId,
        },
        data: {
          columns: {
            create: [
              {
                title: input.column.title,
                color: Math.floor(Math.random() * 16777215).toString(16),
                tasks: {
                  create: [],
                },
              },
            ],
          },
        },
      });
    }),

  // createTask using the input createTaskFormSchema, a boardId, and a columnId
  createTask: protectedProcedure
    .input(
      z.object({
        boardId: z.string(),
        task: createTaskFormSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // get the max order of the tasks in the column
      const maxOrderItem = await ctx.prisma.task.findFirst({
        where: {
          columnId: input.task.columnId,
        },
        orderBy: {
          order: "desc",
        },
      });
      // set the order of the new task to the max order + 1
      const newOrder = maxOrderItem ? maxOrderItem.order + 1 : 1;

      const board = await ctx.prisma.task.create({
        data: {
          title: input.task.title,
          description: input.task.description,
          order: newOrder,
          column: {
            connect: {
              id: input.task.columnId,
            },
          },
          subtasks: {
            create: input.task.subtasks.map((subtask) => ({
              title: subtask.title,
              done: false,
            })),
          },
        },
      });
    }),

  // get the boards from a userId for the navigation menu
  getBoardByUserId: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input, ctx }) => {
      return ctx.prisma.board.findMany({
        where: {
          userId: input.userId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  // get the boards from its Id for the board page
  getBoardById: protectedProcedure
    .input(z.object({ boardId: z.string() }))
    .query(({ input, ctx }) => {
      return ctx.prisma.board.findUnique({
        where: {
          id: input.boardId,
        },
        include: {
          columns: {
            include: {
              tasks: {
                orderBy: {
                  order: "asc",
                },
                include: {
                  subtasks: true,
                },
              },
            },
          },
        },
      });
    }),
});
