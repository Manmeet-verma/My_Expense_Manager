"use client"

import { Button } from "@/components/ui/button"

type ExportExcelButtonProps = {
  data: Array<Record<string, unknown>>
  fileName: string
  sheetName?: string
  label?: string
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
  className?: string
}

function normalizeValue(value: unknown): string | number | boolean {
  if (value instanceof Date) {
    return value.toLocaleString()
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value
  }

  if (value === null || value === undefined) {
    return ""
  }

  return String(value)
}

export function ExportExcelButton({
  data,
  fileName,
  sheetName = "Sheet1",
  label = "Export Excel",
  variant = "outline",
  size = "sm",
  className,
}: ExportExcelButtonProps) {
  async function handleExport() {
    if (!data.length) {
      alert("No data available to export")
      return
    }

    const XLSX = await import("xlsx")
    const normalizedData = data.map((row) => {
      const nextRow: Record<string, string | number | boolean> = {}
      for (const [key, value] of Object.entries(row)) {
        nextRow[key] = normalizeValue(value)
      }
      return nextRow
    })

    const worksheet = XLSX.utils.json_to_sheet(normalizedData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    XLSX.writeFile(workbook, `${fileName}.xlsx`)
  }

  return (
    <Button type="button" variant={variant} size={size} className={className} onClick={() => void handleExport()}>
      {label}
    </Button>
  )
}
