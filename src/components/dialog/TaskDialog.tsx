import { Subtask, Task } from "@prisma/client";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import { MoreVertical, Pen, Trash } from "lucide-react";
import { useState } from "react";
import { api } from "~/utils/api";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useDisclosure } from "~/hooks/useDisclosure";
import { EditTaskDialog } from "./EditTaskDialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@radix-ui/react-alert-dialog";
import { AlertDialogHeader, AlertDialogFooter } from "../ui/alert-dialog";
import { DeleteTaskDialog } from "./DeleteTaskDialog";

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  task: Task & {
    subtasks: Subtask[];
  };
  columns: { id: string; title: string }[];
}

export const TaskDialog: React.FC<Props> = ({
  isOpen,
  onToggle,
  task,
  columns,
}) => {
  const { isOpen: isOpenEdit, onToggle: onToggleEdit } = useDisclosure();
  const { isOpen: isOpenDelete, onToggle: onToggleDelete } = useDisclosure();
  const ctx = api.useContext();
  const { mutate: updateTask, isLoading: isLoadingTask } =
    api.board.updateTask.useMutation({
      onSuccess: () => {
        void ctx.board.getBoardById.invalidate();
        onToggle();
      },
      onError: (err) => {
        console.log(err);
      },
    });

  return (
    <Dialog open={isOpen} onOpenChange={onToggle}>
      <DialogContent className="gap-6 bg-white">
        <DialogHeader>
          <div className="flex justify-between">
            <DialogTitle className="heading-lg text-xl ">
              {task.title}
            </DialogTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex h-8 w-8 p-0 data-[state=open]:bg-muted "
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuItem
                  onClick={() => {
                    onToggleEdit();
                  }}
                >
                  <Pen className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    onToggleDelete();
                  }}
                >
                  <Trash className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogHeader>
        {task.description ? (
          <p className="text-sm text-medgray">{task.description}</p>
        ) : null}
        {task.subtasks.length > 0 ? (
          <div className="flex flex-col gap-4">
            <h3 className="heading-m text-medgray dark:text-white">{`Subtasks`}</h3>

            {task.subtasks.map((subtask) => (
              <SubtaskCard key={subtask.id} subtask={subtask} />
            ))}
          </div>
        ) : null}
        <div className="flex flex-col gap-4">
          <h3 className="heading-m text-medgray dark:text-white">
            Current Status
          </h3>
          <Select
            onValueChange={(value) => {
              const { createdAt, updatedAt, ...taskObject } = task;
              taskObject.columnId = value;
              updateTask({ task: taskObject });
            }}
            defaultValue={task.columnId}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {columns.map((column) => (
                <SelectItem key={column.id} value={column.id}>
                  {column.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <EditTaskDialog
            isOpen={isOpenEdit}
            onToggle={onToggleEdit}
            parentToggle={onToggle}
            task={task}
            columns={columns}
          />
          <DeleteTaskDialog
            isOpen={isOpenDelete}
            onToggle={onToggleDelete}
            parentToggle={onToggle}
            taskId={task.id}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface SubtaskProps {
  subtask: Subtask;
}

const SubtaskCard: React.FC<SubtaskProps> = ({ subtask }) => {
  const ctx = api.useContext();
  const [isChecked, setChecked] = useState(subtask.done);
  const { mutate: updateSubtaskTask, isLoading: isLoadingSubTask } =
    api.board.updateSubtask.useMutation({
      onSuccess: () => {
        void ctx.board.getBoardById.invalidate();
      },
      onError: (err) => {
        console.log(err);
      },
    });
  return (
    <div className="flex items-center rounded-md bg-background p-3">
      <Checkbox
        checked={isChecked}
        onCheckedChange={() => {
          const { createdAt, updatedAt, ...updatedSubtask } = subtask;
          updatedSubtask.done = !subtask.done;
          setChecked(!isChecked);
          updateSubtaskTask({
            subtask: updatedSubtask,
          });
        }}
        className="mr-4"
      />
      <p className={`${isChecked ? "text-medgray line-through" : ""}`}>
        {subtask.title}
      </p>
    </div>
  );
};
