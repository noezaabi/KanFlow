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
      const currentBoards = await ctx.prisma.board.findMany({
        where: {
          userId: ctx.session.user.id,
        },
      });
      const boardNumber = currentBoards ? currentBoards.length : 0;
      return await ctx.prisma.board.create({
        data: {
          title: input.title,
          order: boardNumber,
          columns: {
            create: input.columns.map((column, index) => ({
              title: column.title,
              color: Math.floor(Math.random() * 16777215).toString(16),
              order: index,
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
      const currentBoard = await ctx.prisma.board.findUnique({
        where: {
          id: input.boardId,
        },

        include: {
          columns: true,
        },
      });

      const columnNumber = currentBoard ? currentBoard.columns.length : 0;

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
                order: columnNumber,
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
            upsert: input.board.columns.map((column, index) => ({
              where: {
                id: column.id,
              },
              update: {
                title: column.title,
                order: index,
              },
              create: {
                title: column.title,
                order: index,
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
      const currentColumn = await ctx.prisma.column.findUnique({
        where: {
          id: input.columnId,
        },
      });
      const board = await ctx.prisma.board.findUnique({
        where: {
          id: currentColumn!.boardId,
        },
        include: {
          columns: true,
        },
      });

      if (board) {
        await Promise.all(
          board.columns
            .filter((column) => column.order > currentColumn!.order)
            .map(async (col) => {
              await ctx.prisma.column.update({
                where: {
                  id: col.id,
                },
                data: {
                  order: col.order - 1,
                },
              });
            })
        );
      }

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

  // reorderColumns using the a list of columns
  reorderColumns: protectedProcedure
    .input(
      z.object({
        columns: z.array(
          z.object({
            id: z.string(),
            order: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await Promise.all(
        input.columns.map(async (column) => {
          await ctx.prisma.column.update({
            where: {
              id: column.id,
            },
            data: {
              order: column.order,
            },
          });
        })
      );
    }),

  //reorder boards
  reorderBoards: protectedProcedure
    .input(
      z.object({
        boards: z.array(
          z.object({
            id: z.string(),
            order: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await Promise.all(
        input.boards.map(async (board) => {
          await ctx.prisma.board.update({
            where: {
              id: board.id,
            },
            data: {
              order: board.order,
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
      input.task.subtasks.map((subtask, index) => (subtask.order = index));
      const initialTask = await ctx.prisma.task.findUnique({
        where: {
          id: input.task.id,
        },
      });
      await ctx.prisma.task.update({
        where: {
          id: input.task.id,
        },
        data: {
          title: input.task.title,
          description: input.task.description,
          columnId: input.task.columnId,
          order: input.task.order,
          subtasks: {
            upsert: input.task.subtasks.map((subtask, index) => ({
              where: {
                id: subtask.id,
              },
              update: {
                title: subtask.title,
                order: index,
                done: subtask.done,
              },
              create: {
                title: subtask.title,
                order: index,
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
      const currentTaskColumnId = await ctx.prisma.task.findUnique({
        where: {
          id: input.taskId,
        },
        select: {
          columnId: true,
        },
      });
      const taskColumn = await ctx.prisma.column.findUnique({
        where: {
          id: currentTaskColumnId?.columnId,
        },
        include: {
          tasks: true,
        },
      });
      const currentTask = await ctx.prisma.task.findUnique({
        where: {
          id: input.taskId,
        },
      });
      if (taskColumn) {
        await Promise.all(
          taskColumn.tasks
            .filter((task) => task.order > currentTask!.order)
            .map(async (task) => {
              await ctx.prisma.task.update({
                where: {
                  id: task.id,
                },
                data: {
                  order: task.order - 1,
                },
              });
            })
        );
      }
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
      const currentBoard = await ctx.prisma.board.findUnique({
        where: {
          id: input.boardId,
        },
      });
      const user = await ctx.prisma.user.findUnique({
        where: {
          id: currentBoard!.userId,
        },
        include: {
          boards: true,
        },
      });
      if (user) {
        await Promise.all(
          user.boards
            .filter((board) => board.order > currentBoard!.order)
            .map(async (board) => {
              await ctx.prisma.board.update({
                where: {
                  id: board.id,
                },
                data: {
                  order: board.order - 1,
                },
              });
            })
        );
      }
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
          order: "asc",
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
              order: "asc",
            },
            include: {
              tasks: {
                orderBy: {
                  order: "asc",
                },
                include: {
                  subtasks: {
                    orderBy: {
                      order: "asc",
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
