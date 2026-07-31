import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/commerce/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStoreEmployees, getEmployeeFinancials, closePayrollMonth } from "@/services/hr.functions";
import { formatMoney } from "@/lib/money";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmployeeAdvanceDialog } from "@/components/admin/hr/employee-advance-dialog";

export const Route = createFileRoute("/admin/financeiro/folha")({
  head: () => ({ meta: [{ title: "Gestão de RH e Folha — Admin" }] }),
  loader: async () => {
    const employees = await getStoreEmployees();
    return { employees: employees || [] };
  },
  component: HrPayrollPage,
});

function HrPayrollPage() {
  const { employees } = Route.useLoaderData();
  const router = Route.useRouter();
  const [selectedEmployee, setSelectedEmployee] = useState<string>(employees[0]?.user_id || "");
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Carrega os registros financeiros do funcionário selecionado
  const fetchRecords = async (empId: string) => {
    if (!empId) return;
    setLoading(true);
    try {
      const data = await getEmployeeFinancials({ data: { employeeId: empId, status: "pending" } });
      setRecords(data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Efeito ao trocar o funcionário no select
  useState(() => {
    if (selectedEmployee) fetchRecords(selectedEmployee);
  });

  const handleClosePayroll = async () => {
    if (!selectedEmployee) return;
    if (!confirm("Tem certeza que deseja FECHAR a folha deste funcionário? Todos os registros pendentes ficarão imutáveis.")) return;
    
    setLoading(true);
    try {
      await closePayrollMonth({ data: { employeeId: selectedEmployee } });
      toast.success("Folha fechada com sucesso!");
      fetchRecords(selectedEmployee);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const totalCredits = records.filter(r => r.amount_cents > 0).reduce((acc, curr) => acc + curr.amount_cents, 0);
  const totalDebits = records.filter(r => r.amount_cents < 0).reduce((acc, curr) => acc + Math.abs(curr.amount_cents), 0);
  const liquid = totalCredits - totalDebits;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Folha Sintética e Vales"
        description="Controle comissões, salários base e adiantamentos."
      />

      <div className="flex gap-4 items-center bg-card p-4 rounded-lg border">
        <div className="w-72">
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Selecione o Funcionário
          </label>
          <Select 
            value={selectedEmployee} 
            onValueChange={(val) => {
              setSelectedEmployee(val);
              fetchRecords(val);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp: any) => (
                <SelectItem key={emp.user_id} value={emp.user_id}>
                  {emp.users?.raw_user_meta_data?.name || "Usuário"} ({emp.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="ml-auto flex gap-2">
          <EmployeeAdvanceDialog 
            employeeId={selectedEmployee} 
            onSuccess={() => fetchRecords(selectedEmployee)} 
          />
          <Button 
            variant="destructive" 
            onClick={handleClosePayroll} 
            disabled={loading || records.length === 0}
          >
            Fechar Mês (Travar)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Créditos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{formatMoney(totalCredits)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Débitos (Vales)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">-{formatMoney(totalDebits)}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80">Saldo Líquido (A Pagar)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(liquid)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={r.amount_cents < 0 ? "border-red-200 text-red-700 bg-red-50" : "border-green-200 text-green-700 bg-green-50"}>
                    {r.type === 'commission' ? 'Comissão' : r.type === 'advance_payment' ? 'Vale / Adiantamento' : r.type}
                  </Badge>
                </TableCell>
                <TableCell>{r.description || "-"}</TableCell>
                <TableCell className={`text-right font-semibold ${r.amount_cents < 0 ? "text-red-600" : "text-green-600"}`}>
                  {r.amount_cents < 0 ? "-" : "+"}{formatMoney(Math.abs(r.amount_cents))}
                </TableCell>
              </TableRow>
            ))}
            {records.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum registro financeiro pendente neste mês.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
