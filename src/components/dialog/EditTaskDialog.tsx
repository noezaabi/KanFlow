import { zodResolver } from "@hookform/resolvers/zod";
import { Subtask, Task } from "@prisma/client";
import Image from "next/image";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { updateTaskFormSchema } from "~/const/form-validation-schema";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";
import { Button } from "../ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/text-area";

interface Props {
  isOpen: boolean;
  parentToggle: () => void;
  onToggle: () => void;
  task: Task & {
    subtasks: Subtask[];
  };
  columns: { id: string; title: string }[];
}

export const EditTaskDialog: React.FC<Props> = ({
  isOpen,
  parentToggle,
  onToggle,
  task,
  columns,
}) => {
  const ctx = api.useContext();
  const { mutate: editTask, isLoading } = api.board.updateTask.useMutation({
    onSuccess: () => {
      void ctx.board.getBoardById.invalidate();
      onToggle();
      parentToggle();
    },
    onError: (err) => {
      console.log(err);
    },
  });

  const form = useForm<z.infer<typeof updateTaskFormSchema>>({
    resolver: zodResolver(updateTaskFormSchema),
    defaultValues: {
      id: task.id,
      subtasks: task.subtasks,
      title: task.title,
      description: task.description,
      columnId: task.columnId,
    },
  });
  const { fields, append, remove } = useFieldArray({
    name: "subtasks",
    control: form.control,
  });

  function onSubmit(values: z.infer<typeof updateTaskFormSchema>) {
    editTask({
      task: {
        id: task.id,
        title: values.title,
        order: task.order,
        description: values.description,
        columnId: values.columnId,
        subtasks: values.subtasks,
      },
    });
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
          <DialogTitle className="heading-lg">Edit Task</DialogTitle>
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
                onClick={() => append({ id: "NA", title: "", done: false })}
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
                      defaultValue={task.columnId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {columns.map((column) => (
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
              Edit Task
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
