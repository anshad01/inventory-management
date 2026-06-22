import { Construction } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({
  title,
  description,
  note,
}: {
  title: string;
  description: string;
  note: string;
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Construction className="size-6" />
          </div>
          <div className="max-w-md">
            <p className="font-medium">Planned for an upcoming milestone</p>
            <p className="mt-1 text-sm text-muted-foreground">{note}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
