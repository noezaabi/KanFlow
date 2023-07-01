import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBoardFormSchema } from "~/const/form-validation-schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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

interface Props {
  isOpen: boolean;
  onToggle: () => void;
}

export const CreateBoardDialog: React.FC<Props> = ({ isOpen, onToggle }) => {
  const ctx = api.useContext();
  const { mutate: addBoard, isLoading } = api.board.createBoard.useMutation({
    onSuccess: () => {
      onToggle();
      void ctx.board.getBoardByUserId.invalidate();
    },
    onError: (err) => {
      console.log(err);
    },
  });

  const form = useForm<z.infer<typeof createBoardFormSchema>>({
    resolver: zodResolver(createBoardFormSchema),
    defaultValues: {
      columns: [{ title: "" }],
    },
  });
  const { fields, append, remove } = useFieldArray({
    name: "columns",
    control: form.control,
  });

  function onSubmit(values: z.infer<typeof createBoardFormSchema>) {
    addBoard(values);
    form.reset();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onToggle}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle className="heading-lg">Add New Board</DialogTitle>
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
                onClick={() => append({ title: "" })}
              >
                + Add New Column
              </Button>
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              Submit
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
