import { api } from "~/utils/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { useRouter } from "next/router";

interface Props {
  isOpen: boolean;
  parentToggle: () => void;
  onToggle: () => void;
  boardId: string;
}

export const DeleteBoardDialog: React.FC<Props> = ({
  isOpen,
  parentToggle,
  onToggle,
  boardId,
}) => {
  const ctx = api.useContext();
  const router = useRouter();
  const { mutate: deleteBoard, isLoading } = api.board.deleteBoard.useMutation({
    onSuccess: async () => {
      void ctx.board.getBoardById.invalidate();
      void ctx.board.getBoardByUserId.invalidate();
      onToggle();
      parentToggle();
      await router.replace("/dashboard");
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
            Delete this board?
          </DialogTitle>
          <p className="py-6 text-sm text-medgray">
            Are you sure you want to delete this board and its data? This action
            cannot be reversed.
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
                deleteBoard({ boardId });
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
