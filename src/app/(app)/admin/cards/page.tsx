"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminCardsPage() {
  const [search, setSearch] = useState("");
  const cards = useQuery(api.cards.list, { search: search || undefined, limit: 100 });
  const releaseCards = useMutation(api.admin.releaseCards);

  const handleReleaseAll = async () => {
    await releaseCards({});
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Cards</h1>
            <p className="text-muted-foreground">Manage card data</p>
          </div>
          <Button onClick={handleReleaseAll}>Release All Unreleased</Button>
        </div>

        <div className="flex items-center gap-4">
          <Input
            placeholder="Search cards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Set</TableHead>
                <TableHead>Rarity</TableHead>=
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards?.map((card) => (
                <TableRow key={card._id}>
                  <TableCell className="font-medium">{card.name}</TableCell>
                  <TableCell>{card.type}</TableCell>
                  <TableCell>{card.setName || card.setCode}</TableCell>
                  <TableCell>{card.rarity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
