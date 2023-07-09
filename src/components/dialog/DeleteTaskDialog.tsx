import { api } from "~/utils/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";

interface Props {
  isOpen: boolean;
  parentToggle: () => void;
  onToggle: () => void;
  taskId: string;
}

export const DeleteTaskDialog: React.FC<Props> = ({
  isOpen,
  parentToggle,
  onToggle,
  taskId,
}) => {
  const ctx = api.useContext();
  const { mutate: deleteTask, isLoading } = api.board.deleteTask.useMutation({
    onSuccess: () => {
      void ctx.board.getBoardById.invalidate();
      onToggle();
      parentToggle();
    },
    onError: (err) => {
      console.log(err);
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onToggle}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle className="heading-lg text-red-400">
            Delete this task?
          </DialogTitle>
          <p className="py-6 text-sm text-medgray">
            Are you sure you want to delete this task and its subtasks? This
            action cannot be reversed.
          </p>
          <div className="flex ">
            <Button
              variant={"secondary"}
              onClick={() => {
                onToggle();
              }}
              className="w-full"
            >
              {" "}
              Cancel{" "}
            </Button>
            <div className="w-8" />
            <Button
              variant={"destructive"}
              onClick={() => {
                deleteTask({ taskId });
              }}
              className="w-full"
            >
              {" "}
              Delete{" "}
            </Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
