import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createColumnFormSchema } from "~/const/form-validation-schema";
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

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  boardId: string;
}

export const CreateColumnDialog: React.FC<Props> = ({
  isOpen,
  onToggle,
  boardId,
}) => {
  const ctx = api.useContext();
  const { mutate: addColumn, isLoading } = api.board.createColumn.useMutation({
    onSuccess: () => {
      onToggle();
      void ctx.board.getBoardById.invalidate();
      form.reset();
    },
    onError: (err) => {
      console.log(err);
    },
  });

  const form = useForm<z.infer<typeof createColumnFormSchema>>({
    resolver: zodResolver(createColumnFormSchema),
    defaultValues: {},
  });

  function onSubmit(values: z.infer<typeof createColumnFormSchema>) {
    addColumn({
      boardId,
      column: {
        title: values.title,
      },
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onToggle}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle className="heading-lg">Add New Column</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={() => {
              void (async () => {
                await form.handleSubmit(onSubmit)();
              })();
            }}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Column Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Backlog" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-full" type="submit" disabled={isLoading}>
              Create
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
