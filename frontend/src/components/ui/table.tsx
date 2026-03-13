"use client";

import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

interface TableProps extends HTMLAttributes<HTMLDivElement> {
  striped?: boolean;
  hoverable?: boolean;
}

export function Table({
  striped = false,
  hoverable = false,
  className = "",
  children,
  ...props
}: TableProps) {
  return (
    <div
      className={`text-text-primary overflow-x-auto w-full ${className}`}
      {...props}
    >
      <table className="w-full border-collapse border-spacing-0 min-w-full">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={`bg-table-header [&>tr]:border-b [&>tr]:border-gray-500 ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableHeaderCell({
  className = "",
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`py-3 px-[18px] text-left text-sm leading-[1.3] font-semibold whitespace-nowrap ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableBody({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
}

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
  striped?: boolean;
  hoverable?: boolean;
}

export function TableRow({
  selected = false,
  striped = false,
  hoverable = false,
  className = "",
  children,
  ...props
}: TableRowProps) {
  return (
    <tr
      className={`border-b border-gray-500 last:border-b-0 ${selected ? "bg-selected" : ""} ${hoverable && !selected ? "hover:bg-bg-hover" : ""} ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  className = "",
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`py-3 px-[18px] text-left text-sm leading-[1.3] whitespace-nowrap ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}
