import { z } from "zod";
import {
  createBoardFormSchema,
  createColumnFormSchema,
  createTaskFormSchema,
  updateTaskFormSchema,
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
      const board = await ctx.prisma.task.create({
        data: {
          title: input.task.title,
          description: input.task.description,
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

  // updateTask using the input updateTaskFormSchema and a boardId
  updateTask: protectedProcedure
    .input(
      z.object({
        task: updateTaskFormSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const board = await ctx.prisma.task.update({
        where: {
          id: input.task.id,
        },
        data: {
          title: input.task.title,
          description: input.task.description,
          columnId: input.task.columnId,
        },
      });
    }),

  updateSubtask: protectedProcedure
    .input(
      z.object({
        subtask: z.object({
          id: z.string(),
          title: z.string(),
          done: z.boolean(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const board = await ctx.prisma.subtask.update({
        where: {
          id: input.subtask.id,
        },
        data: {
          title: input.subtask.title,
          done: input.subtask.done,
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
            orderBy: {
              createdAt: "asc",
            },
            include: {
              tasks: {
                include: {
                  subtasks: {
                    orderBy: {
                      createdAt: "asc",
                    },
                  },
                },
              },
            },
          },
        },
      });
    }),
});
