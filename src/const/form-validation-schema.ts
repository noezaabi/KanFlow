import * as z from "zod";

export const createBoardFormSchema = z.object({
  title: z.string().nonempty({ message: "A title is required." }),
  columns: z
    .array(
      z.object({
        title: z.string().nonempty({ message: "A column name is required." }),
      })
    )
    .nonempty({ message: "At least one column is required." }),
});

export const editBoardFormSchema = z.object({
  id: z.string().nonempty({ message: "A board id is required." }),
  title: z.string().nonempty({ message: "A title is required." }),
  columns: z
    .array(
      z.object({
        id: z.string().nonempty({ message: "A column id is required." }),
        title: z.string().nonempty({ message: "A column name is required." }),
        color: z.string(),
      })
    )
    .nonempty({ message: "At least one column is required." }),
});

export const createColumnFormSchema = z.object({
  title: z.string().nonempty({ message: "A title is required." }),
});

export const createTaskFormSchema = z.object({
  title: z.string().nonempty({ message: "A title is required." }),
  description: z.string(),
  columnId: z.string().nonempty({ message: "A column is required." }),
  subtasks: z.array(
    z.object({
      title: z.string().nonempty({ message: "A subtask name is required." }),
    })
  ),
});

export const updateTaskFormSchema = z.object({
  id: z.string().nonempty({ message: "A task id is required." }),
  title: z.string().nonempty({ message: "A title is required." }),
  description: z.string(),
  columnId: z.string().nonempty({ message: "A column is required." }),
  subtasks: z.array(
    z.object({
      id: z.string().nonempty({ message: "A subtask id is required." }),
      title: z.string().nonempty({ message: "A subtask name is required." }),
      done: z.boolean(),
    })
  ),
});

// model Task {
//   id          String   @id @default(cuid())
//   createdAt   DateTime @default(now())
//   updatedAt   DateTime @updatedAt
//   title       String
//   description String
//   subtasks    Subtask[]
//   column      Column   @relation(fields: [columnId], references: [id], onDelete: Cascade)
//   columnId    String
// }

// model Subtask {
//   id        String   @id @default(cuid())
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
//   title     String
//   task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
//   taskId    String
//   done      Boolean  @default(false)
// }
