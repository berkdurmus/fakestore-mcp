import React from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

interface AgentDetailsDialogProps {
  plan?: {
    thoughts: string;
    actions: unknown[];
  };
  actions: Array<{
    action: string;
    result: unknown;
  }>;
  reasoning?: string;
}

export const AgentDetailsDialog = ({
  plan,
  actions,
  reasoning,
}: AgentDetailsDialogProps) => {
  return (
    <div className="flex justify-end">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4 mr-1" />
            <span>View details</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agent details</DialogTitle>
            <DialogDescription>
              See how the AI agent processed your request
            </DialogDescription>
          </DialogHeader>

          {/* Agent thought process */}
          {plan && (
            <div className="mb-4">
              <h4 className="font-medium text-sm mb-2">Thought Process</h4>
              <Card>
                <CardContent className="p-3 text-sm text-muted-foreground">
                  {plan.thoughts}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Agent reasoning - from structured response */}
          {reasoning && (
            <div className="mb-4">
              <h4 className="font-medium text-sm mb-2">Reasoning</h4>
              <Card>
                <CardContent className="p-3 text-sm text-muted-foreground">
                  {reasoning}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Actions taken */}
          <div>
            <h4 className="font-medium text-sm mb-2">Actions Taken</h4>
            <div className="space-y-3">
              {actions.map((action, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {action.action}
                      </span>
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                        API Call
                      </span>
                    </div>
                    <pre className="text-xs font-mono bg-muted p-2 rounded overflow-auto max-h-48">
                      {JSON.stringify(action.result, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
