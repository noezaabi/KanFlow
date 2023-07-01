import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskFormSchema } from "~/const/form-validation-schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { cn } from "~/lib/utils";
import Image from "next/image";
import { api } from "~/utils/api";
import { Textarea } from "../ui/text-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Board, Column, Subtask, Task } from "@prisma/client";

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  boardData: Board & {
    columns: (Column & {
      tasks: (Task & {
        subtasks: Subtask[];
      })[];
    })[];
  };
}

export const CreateTaskDialog: React.FC<Props> = ({
  isOpen,
  onToggle,
  boardData,
}) => {
  const ctx = api.useContext();
  //TODO: Set IsLoading state
  const { mutate: addTask, isLoading } = api.board.createTask.useMutation({
    onSuccess: () => {
      onToggle();
      void ctx.board.getBoardById.invalidate();
    },
    onError: (err) => {
      console.log(err);
    },
  });

  const form = useForm<z.infer<typeof createTaskFormSchema>>({
    resolver: zodResolver(createTaskFormSchema),
    defaultValues: {
      subtasks: [{ title: "" }],
      description: "",
      columnId: boardData.columns[0]?.id,
    },
  });
  const { fields, append, remove } = useFieldArray({
    name: "subtasks",
    control: form.control,
  });

  function onSubmit(values: z.infer<typeof createTaskFormSchema>) {
    addTask({ boardId: boardData.id, task: values });
    form.reset();
  }

  const subTaskPlaceholders = [
    "eg. Make coffee",
    "eg. Drink coffee and smile",
    "e.g. Enjoy sunlight",
    "eg. Get back to work",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onToggle}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle className="heading-lg">Add New Task</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Take a coffee break" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. It's always good to take a break. This 15 minutes break will recharge the batteries a little."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col">
              {fields.map((field, index) => (
                <FormField
                  control={form.control}
                  key={field.id}
                  name={`subtasks.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(index !== 0 && "sr-only")}>
                        Subtasks
                      </FormLabel>
                      <div className="flex gap-4">
                        <FormControl>
                          <Input
                            placeholder={subTaskPlaceholders[index]}
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => {
                            remove(index);
                          }}
                        >
                          <Image
                            src="/images/close.svg"
                            alt="Close"
                            width={15}
                            height={15}
                          />
                        </button>
                      </div>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <Button
                type="button"
                variant="secondary"
                className="mt-3 hover:bg-secondary"
                onClick={() => append({ title: "" })}
              >
                + Add New Subtask
              </Button>
            </div>
            <FormField
              control={form.control}
              name="columnId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={boardData.columns[0]?.id}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {boardData.columns.map((column) => (
                          <SelectItem key={column.id} value={column.id}>
                            {column.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-full" type="submit" disabled={isLoading}>
              Create Task
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
