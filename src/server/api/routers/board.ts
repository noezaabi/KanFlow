import { z } from "zod";
import {
  createBoardFormSchema,
  createColumnFormSchema,
  createTaskFormSchema,
  editBoardFormSchema,
  updateTaskFormSchema,
} from "~/const/form-validation-schema";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const boardRouter = createTRPCRouter({
  // createBoard using the input createBoardFormSchema
  createBoard: protectedProcedure
    .input(createBoardFormSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.board.create({
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
      await ctx.prisma.board.update({
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
      const currentColumns = await ctx.prisma.column.findMany({
        where: {
          boardId: input.boardId,
        },
        include: {
          tasks: true,
        },
      });

      const ownerColumn = currentColumns.filter(
        (column) => column.id === input.task.columnId
      )[0];

      const taskNumber = ownerColumn ? ownerColumn.tasks.length : 0;

      await ctx.prisma.task.create({
        data: {
          title: input.task.title,
          description: input.task.description,
          order: taskNumber,
          column: {
            connect: {
              id: input.task.columnId,
            },
          },
          subtasks: {
            create: input.task.subtasks.map((subtask, index) => ({
              title: subtask.title,
              order: index,
              done: false,
            })),
          },
        },
      });
    }),

  // updateBoard using the input editBoardFormSchema and a boardId
  updateBoard: protectedProcedure
    .input(
      z.object({
        board: editBoardFormSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const initialColumns = await ctx.prisma.column.findMany({
        where: {
          boardId: input.board.id,
        },
      });

      const deletedColumns = initialColumns.filter(
        (initialColumn) =>
          !input.board.columns.some(
            (newColumn) => newColumn.id === initialColumn.id
          )
      );

      await ctx.prisma.column.deleteMany({
        where: {
          id: {
            in: deletedColumns.map((column) => column.id),
          },
        },
      });

      console.log(input.board.title);

      await ctx.prisma.board.update({
        where: {
          id: input.board.id,
        },
        data: {
          title: input.board.title,
          columns: {
            upsert: input.board.columns.map((column) => ({
              where: {
                id: column.id,
              },
              update: {
                title: column.title,
              },
              create: {
                title: column.title,
                color: Math.floor(Math.random() * 16777215).toString(16),
                tasks: {
                  create: [],
                },
              },
            })),
          },
        },
      });
    }),

  // Delete column using the input columnId
  deleteColumn: protectedProcedure
    .input(z.object({ columnId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.column.delete({
        where: {
          id: input.columnId,
        },
      });
    }),

  reorderTasks: protectedProcedure
    .input(
      z.object({
        columnId: z.string(),
        tasks: z.array(
          z.object({
            id: z.string(),
            order: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await Promise.all(
        input.tasks.map(async (task) => {
          await ctx.prisma.task.update({
            where: {
              id: task.id,
            },
            data: {
              order: task.order,
              column: {
                connect: {
                  id: input.columnId,
                },
              },
            },
          });
        })
      );
    }),

  // updateTask using the input updateTaskFormSchema and a boardId
  updateTask: protectedProcedure
    .input(
      z.object({
        task: updateTaskFormSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      input.task.subtasks.map((subtask, index) => (subtask.index = index));
      const initialTask = await ctx.prisma.task.findUnique({
        where: {
          id: input.task.id,
        },
      });
      let numTask = initialTask?.order || 0;
      if (initialTask && initialTask.columnId !== input.task.columnId) {
        const targetColumn = await ctx.prisma.column.findUnique({
          where: {
            id: input.task.columnId,
          },
          include: {
            tasks: true,
          },
        });
        numTask = targetColumn ? targetColumn.tasks.length : 0;
      }

      await ctx.prisma.task.update({
        where: {
          id: input.task.id,
        },
        data: {
          title: input.task.title,
          description: input.task.description,
          columnId: input.task.columnId,
          order: numTask,
          subtasks: {
            upsert: input.task.subtasks.map((subtask) => ({
              where: {
                id: subtask.id,
              },
              update: {
                title: subtask.title,
                order: subtask.index,
                done: subtask.done,
              },
              create: {
                title: subtask.title,
                order: subtask.index ?? 0,
                done: false,
              },
            })),
          },
        },
      });
    }),

  // deleteTask using a taskId
  deleteTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.task.delete({
        where: {
          id: input.taskId,
        },
      });
    }),

  // deleteBoard using a boardId
  deleteBoard: protectedProcedure
    .input(z.object({ boardId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.board.delete({
        where: {
          id: input.boardId,
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
      await ctx.prisma.subtask.update({
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
                orderBy: {
                  order: "asc",
                },
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
