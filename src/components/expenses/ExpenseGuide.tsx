import { X, Plus, Upload, TrendingUp, Edit, Trash2, Download, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ExpenseGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpenseGuide = ({ isOpen, onClose }: ExpenseGuideProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-background border-l shadow-lg z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Expenses Guide</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Add Expenses</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm space-y-2">
                <p>Click the "Add Expense" button to create a new expense entry.</p>
                <p className="font-medium mt-2">You can:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Enter date, merchant, and amount</li>
                  <li>Select a category</li>
                  <li>Add optional description</li>
                  <li>Upload up to 10 receipts (10MB total)</li>
                  <li>Calculate VAT automatically</li>
                </ul>
              </CardDescription>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Bank Import</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm space-y-2">
                <p>Import expenses directly from your bank statements.</p>
                <p className="font-medium mt-2">Supported formats:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>CSV files</li>
                  <li>Excel spreadsheets</li>
                  <li>PDF bank statements (OCR)</li>
                </ul>
                <p className="mt-2">Transactions will be automatically categorized and added to your expenses.</p>
              </CardDescription>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Track Statistics</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm space-y-2">
                <p>Monitor your expense metrics at a glance:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                  <li><strong>Total Expenses:</strong> Sum of all expenses</li>
                  <li><strong>Recoverable VAT:</strong> VAT you can claim back</li>
                  <li><strong>Pending Review:</strong> Expenses awaiting approval</li>
                </ul>
                <p className="mt-2">Use filters to view expenses by category, date range, or VAT status.</p>
              </CardDescription>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Edit Expenses</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm space-y-2">
                <p>Click the edit icon on any expense to modify:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                  <li>Update transaction details</li>
                  <li>Change category or amount</li>
                  <li>Add or remove receipts</li>
                  <li>Adjust VAT calculations</li>
                </ul>
              </CardDescription>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Delete Expenses</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm space-y-2">
                <p>Remove unwanted or duplicate expenses:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                  <li>Click the trash icon on any expense</li>
                  <li>Confirm deletion in the dialog</li>
                  <li>Action cannot be undone</li>
                </ul>
              </CardDescription>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Export Data</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm space-y-2">
                <p>Export your expenses for reporting:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                  <li>Click the "Export" button</li>
                  <li>Choose your preferred format</li>
                  <li>Download filtered or complete data</li>
                  <li>Use for accounting or tax purposes</li>
                </ul>
              </CardDescription>
            </CardContent>
          </Card>

          <div className="pt-4 pb-2">
            <Button onClick={onClose} className="w-full">
              Got it! Close Guide
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};