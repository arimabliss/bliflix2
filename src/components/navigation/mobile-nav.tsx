'use client';

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/types";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from "@/configs/site";
import { RoomSetupModal } from "../watch-together/room-setup-modal";

type MobileNavProps = {
  items: NavItem[];
};

export function MobileNav({ items }: MobileNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = React.useState(false);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <Icons.menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="glass-panel w-[300px] border-none p-0">
          <SheetHeader className="p-6 text-left">
            <SheetTitle>
              <Link
                href="/"
                className="flex items-center space-x-2"
                onClick={() => setIsOpen(false)}
              >
                <span className="text-xl font-bold gradient-text font-clash">
                  {siteConfig.name}
                </span>
              </Link>
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2 p-4">
            <Link
              href="/search"
              className="rounded-xl px-4 py-3 text-lg font-medium text-foreground/60 transition-all hover:bg-white/5 hover:text-foreground"
              onClick={() => setIsOpen(false)}
            >
              Search
            </Link>
            {items?.map((item, index) => (
              item.href && (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "px-4 py-3 text-lg font-medium rounded-xl transition-all",
                    pathname === item.href
                      ? "bg-white/10 text-foreground"
                      : "text-foreground/60 hover:text-foreground hover:bg-white/5"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {item.title}
                </Link>
              )
            ))}
            <Button 
              className="soft-shine mt-4 w-full rounded-xl bg-[image:var(--gradient-primary)] font-semibold text-slate-950"
              onClick={() => {
                setIsOpen(false);
                setIsRoomModalOpen(true);
              }}
            >
              Watch Together
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <RoomSetupModal 
        open={isRoomModalOpen}
        onOpenChange={setIsRoomModalOpen}
        currentEmbedUrl={typeof window !== 'undefined' ? window.location.href : ''}
      />
    </>
  );
}
