"use client";

import { UseQueryResult } from "@tanstack/react-query";

import { SystemActivityListResSchema } from "@/features/system-activity";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineDot,
  TimelineItem,
  TimelineProps,
} from "@/components/ui/timeline";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/component";
import { formatDateTime } from "@/lib/utils/date";

interface SystemActivitiesProps extends Omit<TimelineProps, "children"> {
  query: UseQueryResult<SystemActivityListResSchema>;
}

export default function SystemActivities({ query, className, ...props }: SystemActivitiesProps) {
  const { data: activities, isLoading, isError } = query;

  if (isLoading) {
    return (
      <Timeline className={cn(className)} {...props}>
        {Array.from({ length: 3 }).map((_, index) => (
          <TimelineItem key={index} className="pb-0">
            <TimelineDot />
            <TimelineConnector />
            <TimelineContent>
              <Skeleton className="h-4 w-full" />
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    );
  }

  if (isError) {
    return (
      <Timeline className={cn(className)} {...props}>
        <TimelineItem className="pb-0">
          <TimelineDot />
          <TimelineContent>
            <TimelineDescription className="text-destructive">
              Failed to load system activities
            </TimelineDescription>
          </TimelineContent>
        </TimelineItem>
      </Timeline>
    );
  }

  if (!activities || activities.data.length === 0) {
    return (
      <Timeline className={cn(className)} {...props}>
        <TimelineItem className="pb-0">
          <TimelineDot />
          <TimelineContent>
            <TimelineDescription className="text-muted-foreground">
              No system activities found
            </TimelineDescription>
          </TimelineContent>
        </TimelineItem>
      </Timeline>
    );
  }

  return (
    <Timeline className={cn(className)} {...props}>
      {activities.data.map((item) => {
        const causer = item.causer_name ?? "System";
        const date = formatDateTime(item.created_at);

        const desc = `${causer} ${item.event} this item on ${date}`;

        return (
          <TimelineItem key={item.id} className="pb-0">
            <TimelineDot />
            <TimelineConnector />
            <TimelineContent>
              <TimelineDescription>{desc}</TimelineDescription>
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}
