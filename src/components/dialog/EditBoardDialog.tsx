import { zodResolver } from "@hookform/resolvers/zod";
import { Board, Column } from "@prisma/client";
import Image from "next/image";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { editBoardFormSchema } from "~/const/form-validation-schema";
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
import { Dispatch, SetStateAction } from "react";

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  setKey: Dispatch<SetStateAction<number>>;
  board: Board & {
    columns: Column[];
  };
}

export const EditBoardDialog: React.FC<Props> = ({
  isOpen,
  onToggle,
  board,
  setKey,
}) => {
  const ctx = api.useContext();
  const { mutate: editBoard, isLoading } = api.board.updateBoard.useMutation({
    onSuccess: () => {
      onToggle();
      void ctx.board.getBoardByUserId.invalidate();
      void ctx.board.getBoardById.invalidate();
    },
    onError: (err) => {
      console.log(err);
    },
  });

  const form = useForm<z.infer<typeof editBoardFormSchema>>({
    resolver: zodResolver(editBoardFormSchema),
    defaultValues: {
      id: board.id,
      title: board.title,
      columns: board.columns,
    },
  });
  const { fields, append, remove } = useFieldArray({
    name: "columns",
    control: form.control,
  });

  function onSubmit(values: z.infer<typeof editBoardFormSchema>) {
    editBoard({ board: values });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onToggle}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle className="heading-lg">Edit Board</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, (errors) =>
              console.log(errors)
            )}
            className="space-y-5"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Web Design" {...field} />
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
                  name={`columns.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(index !== 0 && "sr-only")}>
                        Columns
                      </FormLabel>
                      <div className="flex gap-4">
                        <FormControl>
                          <Input placeholder="Todo" {...field} />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => {
                            if (fields.length > 1) {
                              remove(index);
                            } else {
                              form.setError("columns", {
                                type: "min",
                                message: "You must have at least one column",
                              });
                            }
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
                onClick={() => append({ id: "-3", title: "", color: "" })}
              >
                + Add New Column
              </Button>
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              Save Board
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
