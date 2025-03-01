/**
 * v0 by Vercel.
 * @see https://v0.dev/t/zeel1tuzCN8
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { ToggleSwitch } from "@/components/ui/toggle"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function Component() {
  return (
    <div className="w-full overflow-auto">
      <header className="flex justify-between items-center p-4 bg-gray-100">
        <h1 className="text-lg font-bold">User Management</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm">View Mode</span>
          <div />
          <span className="text-sm">Edit Mode</span>
        </div>
      </header>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">ID</TableHead>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead className="w-[200px]">Email</TableHead>
            <TableHead className="w-[200px]">Phone</TableHead>
            <TableHead className="w-[200px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">1</TableCell>
            <TableCell>
              <Input type="text" defaultValue="John Doe" />
            </TableCell>
            <TableCell>
              <Input type="email" defaultValue="john.doe@example.com" />
            </TableCell>
            <TableCell>
              <Input type="tel" defaultValue="123-456-7890" />
            </TableCell>
            <TableCell className="flex space-x-2">
              <Button variant="outline" size="sm">
                Edit
              </Button>
              <Button variant="outline" size="sm">
                Delete
              </Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">2</TableCell>
            <TableCell>
              <Input type="text" defaultValue="Jane Doe" />
            </TableCell>
            <TableCell>
              <Input type="email" defaultValue="jane.doe@example.com" />
            </TableCell>
            <TableCell>
              <Input type="tel" defaultValue="098-765-4321" />
            </TableCell>
            <TableCell className="flex space-x-2">
              <Button variant="outline" size="sm">
                Edit
              </Button>
              <Button variant="outline" size="sm">
                Delete
              </Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">3</TableCell>
            <TableCell>
              <Input type="text" defaultValue="James Smith" />
            </TableCell>
            <TableCell>
              <Input type="email" defaultValue="james.smith@example.com" />
            </TableCell>
            <TableCell>
              <Input type="tel" defaultValue="321-654-0987" />
            </TableCell>
            <TableCell className="flex space-x-2">
              <Button variant="outline" size="sm">
                Edit
              </Button>
              <Button variant="outline" size="sm">
                Delete
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Button className="mt-4">Add Row</Button>
    </div>
  )
}