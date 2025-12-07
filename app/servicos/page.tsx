"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useLoja } from "@/lib/contexts/loja-context"
import {
    useServicosRealizados,
    useMotivosProblemas,
    useFuncionarios,
} from "@/lib/hooks/useLojaData"
import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { CheckCircle2, XCircle, Upload, Plus, X, AlertCircle } from "lucide-react"

export default function ServicosPage() {
    const router = useRouter()
    const { lojaAtual } = useLoja()
    const lojaId = lojaAtual?.id
    const { servicosRealizados, loading, refetch } = useServicosRealizados(lojaId)
    const { motivos } = useMotivosProblemas(lojaId)
    const { funcionarios } = useFuncionarios(lojaId)

    const [busca, setBusca] = useState("")
    const [modalAberto, setModalAberto] = useState(false)
    const [servicoSelecionado, setServicoSelecionado] = useState<any>(null)
    const [ocorreuPerfeitamente, setOcorreuPerfeitamente] = useState<boolean | null>(null)
    const [problemas, setProblemas] = useState<any[]>([])
    const [arquivosComprovacao, setArquivosComprovacao] = useState<File[]>([])
    const [funcionarioResponsavel, setFuncionarioResponsavel] = useState("")
    const [termoAceito, setTermoAceito] = useState(false)
    const [salvando, setSalvando] = useState(false)

    // Separar serviços por status
    const servicosAbertos = servicosRealizados.filter(
        (s) => s.status === "aberto" || s.status === "em_andamento"
    )
    const servicosFinalizados = servicosRealizados.filter((s) => s.status === "finalizado")

    // Filtrar serviços pela busca
    const filtrarServicos = (servicos: any[]) => {
        if (!busca) return servicos
        return servicos.filter(
            (s) =>
                s.servico?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
                s.cliente?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
                s.cliente?.telefone?.includes(busca)
        )
    }

    const handleFinalizarClick = (servico: any) => {
        setServicoSelecionado(servico)
        setModalAberto(true)
        setOcorreuPerfeitamente(null)
        setProblemas([])
        setArquivosComprovacao([])
        setFuncionarioResponsavel("")
        setTermoAceito(false)
    }

    const adicionarProblema = () => {
        setProblemas([
            ...problemas,
            {
                id: Date.now(),
                motivo_id: "",
                culpado: "",
                culpado_funcionario_id: null,
                descricao: "",
                custo_extra: 0,
                arquivos: [],
            },
        ])
    }

    const removerProblema = (id: number) => {
        setProblemas(problemas.filter((p) => p.id !== id))
    }

    const atualizarProblema = (id: number, campo: string, valor: any) => {
        setProblemas(
            problemas.map((p) => (p.id === id ? { ...p, [campo]: valor } : p))
        )
    }

    const handleArquivoProblema = (id: number, files: FileList | null) => {
        if (!files) return
        const novosArquivos = Array.from(files)
        setProblemas(
            problemas.map((p) =>
                p.id === id ? { ...p, arquivos: [...(p.arquivos || []), ...novosArquivos] } : p
            )
        )
    }

    const removerArquivoProblema = (problemaId: number, arquivoIndex: number) => {
        setProblemas(
            problemas.map((p) =>
                p.id === problemaId
                    ? { ...p, arquivos: p.arquivos.filter((_: any, i: number) => i !== arquivoIndex) }
                    : p
            )
        )
    }

    const uploadArquivo = async (file: File, servicoRealizadoId: string, tipo: string) => {
        const supabase = createClient()
        const fileExt = file.name.split(".").pop()
        const fileName = `${servicoRealizadoId}/${tipo}/${Date.now()}.${fileExt}`

        const { data, error } = await supabase.storage
            .from("servicos-arquivos")
            .upload(fileName, file)

        if (error) throw error

        const {
            data: { publicUrl },
        } = supabase.storage.from("servicos-arquivos").getPublicUrl(fileName)

        return { url: publicUrl, nome_arquivo: file.name }
    }

    const handleFinalizar = async () => {
        if (!funcionarioResponsavel || !termoAceito) {
            alert("Preencha todos os campos obrigatórios e aceite o termo de responsabilidade")
            return
        }

        if (ocorreuPerfeitamente === null) {
            alert("Informe se o serviço ocorreu perfeitamente")
            return
        }

        if (!ocorreuPerfeitamente && problemas.length === 0) {
            alert("Adicione pelo menos um problema reportado")
            return
        }

        setSalvando(true)

        try {
            console.log("=== INICIANDO FINALIZAÇÃO DE SERVIÇO ===")
            console.log("servicoSelecionado:", servicoSelecionado)
            console.log("ocorreuPerfeitamente:", ocorreuPerfeitamente)
            console.log("problemas:", problemas)
            console.log("arquivosComprovacao:", arquivosComprovacao)
            
            const supabase = createClient()
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) throw new Error("Usuário não autenticado")

            console.log("Usuário autenticado:", user.id)

            // Atualizar status do serviço
            console.log("Atualizando status do serviço...")
            const { error: updateError } = await supabase
                .from("servicos_realizados")
                .update({
                    status: "finalizado",
                    data_conclusao: new Date().toISOString(),
                    funcionario_responsavel_id: funcionarioResponsavel,
                })
                .eq("id", servicoSelecionado.id)

            if (updateError) {
                console.error("Erro ao atualizar status:", updateError)
                throw updateError
            }

            console.log("Status atualizado com sucesso")

            // Upload de arquivos de comprovação
            if (ocorreuPerfeitamente && arquivosComprovacao.length > 0) {
                console.log("Fazendo upload de arquivos de comprovação...")
                for (const arquivo of arquivosComprovacao) {
                    const { url, nome_arquivo } = await uploadArquivo(
                        arquivo,
                        servicoSelecionado.id,
                        "comprovacao"
                    )

                    await supabase.from("servicos_arquivos").insert({
                        servico_realizado_id: servicoSelecionado.id,
                        tipo: "comprovacao",
                        url,
                        nome_arquivo,
                        tamanho: arquivo.size,
                        mime_type: arquivo.type,
                        uploaded_by: user.id,
                    })
                }
            }

            // Registrar problemas
            if (!ocorreuPerfeitamente && problemas.length > 0) {
                console.log("Registrando problemas...")
                for (const problema of problemas) {
                    console.log("Inserindo problema:", problema)
                    const { data: problemaData, error: problemaError } = await supabase
                        .from("servicos_problemas")
                        .insert({
                            servico_realizado_id: servicoSelecionado.id,
                            motivo_id: problema.motivo_id,
                            culpado: problema.culpado,
                            culpado_funcionario_id: problema.culpado_funcionario_id,
                            descricao: problema.descricao,
                            custo_extra: problema.custo_extra || 0,
                            registrado_por: user.id,
                            termo_aceito: true,
                            termo_aceito_em: new Date().toISOString(),
                        })
                        .select()
                        .single()

                    if (problemaError) {
                        console.error("Erro ao inserir problema:", problemaError)
                        throw problemaError
                    }

                    console.log("Problema registrado:", problemaData)

                    // Upload de arquivos do problema
                    if (problema.arquivos && problema.arquivos.length > 0) {
                        for (const arquivo of problema.arquivos) {
                            const { url, nome_arquivo } = await uploadArquivo(
                                arquivo,
                                servicoSelecionado.id,
                                "problema"
                            )

                            await supabase.from("servicos_arquivos").insert({
                                servico_realizado_id: servicoSelecionado.id,
                                tipo: "problema",
                                url,
                                nome_arquivo,
                                tamanho: arquivo.size,
                                mime_type: arquivo.type,
                                uploaded_by: user.id,
                            })
                        }
                    }
                }
            }

            alert("Serviço finalizado com sucesso!")
            setModalAberto(false)
            refetch()
        } catch (error: any) {
            console.error("Erro ao finalizar serviço:", error)
            console.error("Detalhes do erro:", {
                message: error?.message,
                code: error?.code,
                details: error?.details,
                hint: error?.hint,
            })
            alert(`Erro ao finalizar serviço: ${error?.message || "Erro desconhecido"}. Verifique o console para mais detalhes.`)
        } finally {
            setSalvando(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { variant: any; label: string }> = {
            aberto: { variant: "default", label: "Aberto" },
            em_andamento: { variant: "secondary", label: "Em Andamento" },
            finalizado: { variant: "default", label: "Finalizado" },
            cancelado: { variant: "destructive", label: "Cancelado" },
        }
        const badge = badges[status] || { variant: "default", label: status }
        return <Badge variant={badge.variant}>{badge.label}</Badge>
    }

    const formatarData = (data: string) => {
        return new Date(data).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    if (loading) {
        return (
            <div className="flex min-h-screen bg-background">
                <Sidebar />
                <main className="flex-1 lg:ml-64">
                    <div className="flex h-screen items-center justify-center">
                        <p>Carregando serviços...</p>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="flex-1 lg:ml-64">
                <PageHeader
                    title="Serviços"
                    subtitle="Gerencie os serviços realizados e em andamento"
                />

                <div className="space-y-4 p-4 lg:space-y-6 lg:p-8">
                    {/* Busca */}
                    <div className="flex gap-4">
                        <Input
                            placeholder="Buscar por serviço, cliente ou telefone..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="max-w-md"
                        />
                    </div>

                    {/* Tabs */}
                    <Tabs defaultValue="abertos" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="abertos">
                                Em Aberto ({servicosAbertos.length})
                            </TabsTrigger>
                            <TabsTrigger value="historico">
                                Histórico ({servicosFinalizados.length})
                            </TabsTrigger>
                        </TabsList>

                        {/* Serviços em Aberto */}
                        <TabsContent value="abertos" className="space-y-4">
                            {filtrarServicos(servicosAbertos).length === 0 ? (
                                <Card className="p-8 text-center">
                                    <p className="text-muted-foreground">
                                        Nenhum serviço em aberto no momento
                                    </p>
                                </Card>
                            ) : (
                                filtrarServicos(servicosAbertos).map((servico) => (
                                    <Card key={servico.id} className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-semibold">
                                                        {servico.servico?.nome || "Serviço"}
                                                    </h3>
                                                    {getStatusBadge(servico.status)}
                                                    {servico.pago ? (
                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                            ✓ Pago
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                                            Pagamento Pendente
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="space-y-1 text-sm text-muted-foreground">
                                                    <p>
                                                        <strong>Cliente:</strong> {servico.cliente?.nome || "N/A"} -{" "}
                                                        {servico.cliente?.telefone || "N/A"}
                                                    </p>
                                                    <p>
                                                        <strong>Data de Início:</strong>{" "}
                                                        {formatarData(servico.data_inicio)}
                                                    </p>
                                                    {servico.data_prevista_conclusao && (
                                                        <p>
                                                            <strong>Previsão de Conclusão:</strong>{" "}
                                                            {formatarData(servico.data_prevista_conclusao)}
                                                        </p>
                                                    )}
                                                    {!servico.pago && (
                                                        <p className="text-orange-600 font-medium">
                                                            <strong>⚠️ Pagamento após conclusão</strong>
                                                        </p>
                                                    )}
                                                    {servico.observacoes && (
                                                        <p>
                                                            <strong>Observações:</strong> {servico.observacoes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <Button onClick={() => handleFinalizarClick(servico)}>
                                                Finalizar
                                            </Button>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </TabsContent>

                        {/* Histórico */}
                        <TabsContent value="historico" className="space-y-4">
                            {filtrarServicos(servicosFinalizados).length === 0 ? (
                                <Card className="p-8 text-center">
                                    <p className="text-muted-foreground">
                                        Nenhum serviço finalizado ainda
                                    </p>
                                </Card>
                            ) : (
                                filtrarServicos(servicosFinalizados).map((servico) => (
                                    <Card key={servico.id} className="p-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-lg font-semibold">
                                                    {servico.servico?.nome || "Serviço"}
                                                </h3>
                                                {getStatusBadge(servico.status)}
                                                {servico.pago ? (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                        ✓ Pago
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                                        Pagamento Pendente
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="space-y-1 text-sm text-muted-foreground">
                                                <p>
                                                    <strong>Cliente:</strong> {servico.cliente?.nome || "N/A"} -{" "}
                                                    {servico.cliente?.telefone || "N/A"}
                                                </p>
                                                <p>
                                                    <strong>Data de Início:</strong>{" "}
                                                    {formatarData(servico.data_inicio)}
                                                </p>
                                                <p>
                                                    <strong>Data de Conclusão:</strong>{" "}
                                                    {formatarData(servico.data_conclusao)}
                                                </p>
                                                {!servico.pago && (
                                                    <p className="text-orange-600 font-medium">
                                                        ⚠️ Aguardando pagamento após conclusão
                                                    </p>
                                                )}
                                                {servico.observacoes && (
                                                    <p>
                                                        <strong>Observações:</strong> {servico.observacoes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Modal de Finalização */}
                <Dialog open={modalAberto} onOpenChange={setModalAberto}>
                    <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Finalizar Serviço</DialogTitle>
                            <DialogDescription>
                                {servicoSelecionado?.servico?.nome} - {servicoSelecionado?.cliente?.nome}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Pergunta Principal */}
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">
                                    O serviço ocorreu perfeitamente?
                                </Label>
                                <div className="flex gap-4">
                                    <Button
                                        variant={ocorreuPerfeitamente === true ? "default" : "outline"}
                                        onClick={() => setOcorreuPerfeitamente(true)}
                                        className="flex-1"
                                    >
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Sim
                                    </Button>
                                    <Button
                                        variant={ocorreuPerfeitamente === false ? "default" : "outline"}
                                        onClick={() => setOcorreuPerfeitamente(false)}
                                        className="flex-1"
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Não
                                    </Button>
                                </div>
                            </div>

                            {/* Upload de Comprovação (se Sim) */}
                            {ocorreuPerfeitamente === true && (
                                <div className="space-y-2">
                                    <Label>Upload de Fotos de Comprovação</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => {
                                                if (e.target.files) {
                                                    setArquivosComprovacao([
                                                        ...arquivosComprovacao,
                                                        ...Array.from(e.target.files),
                                                    ])
                                                }
                                            }}
                                            className="flex-1"
                                        />
                                    </div>
                                    {arquivosComprovacao.length > 0 && (
                                        <div className="space-y-2">
                                            {arquivosComprovacao.map((arquivo, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between rounded border p-2"
                                                >
                                                    <span className="text-sm">{arquivo.name}</span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            setArquivosComprovacao(
                                                                arquivosComprovacao.filter((_, i) => i !== index)
                                                            )
                                                        }
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Problemas (se Não) */}
                            {ocorreuPerfeitamente === false && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-semibold">Problemas Ocorridos</Label>
                                        <Button size="sm" onClick={adicionarProblema}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Adicionar Problema
                                        </Button>
                                    </div>

                                    {problemas.map((problema) => (
                                        <Card key={problema.id} className="p-4 space-y-4">
                                            <div className="flex items-start justify-between">
                                                <Label className="text-sm font-semibold">Problema</Label>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => removerProblema(problema.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="grid gap-4">
                                                <div className="space-y-2">
                                                    <Label>Motivo do Problema</Label>
                                                    <Select
                                                        value={problema.motivo_id}
                                                        onValueChange={(value) =>
                                                            atualizarProblema(problema.id, "motivo_id", value)
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione o motivo" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {motivos.map((motivo) => (
                                                                <SelectItem key={motivo.id} value={motivo.id}>
                                                                    {motivo.nome}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Culpado</Label>
                                                    <Select
                                                        value={problema.culpado}
                                                        onValueChange={(value) =>
                                                            atualizarProblema(problema.id, "culpado", value)
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione o culpado" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="funcionario">Funcionário</SelectItem>
                                                            <SelectItem value="cliente">Cliente</SelectItem>
                                                            <SelectItem value="outros">Outros</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {problema.culpado === "funcionario" && (
                                                    <div className="space-y-2">
                                                        <Label>Funcionário Responsável</Label>
                                                        <Select
                                                            value={problema.culpado_funcionario_id || ""}
                                                            onValueChange={(value) =>
                                                                atualizarProblema(
                                                                    problema.id,
                                                                    "culpado_funcionario_id",
                                                                    value
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecione o funcionário" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {funcionarios.map((func) => (
                                                                    <SelectItem key={func.id} value={func.id}>
                                                                        {func.nome}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}

                                                <div className="space-y-2">
                                                    <Label>Descrição do Problema</Label>
                                                    <Textarea
                                                        value={problema.descricao}
                                                        onChange={(e) =>
                                                            atualizarProblema(problema.id, "descricao", e.target.value)
                                                        }
                                                        placeholder="Descreva o problema em detalhes..."
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Custo Extra (R$)</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={problema.custo_extra}
                                                        onChange={(e) =>
                                                            atualizarProblema(
                                                                problema.id,
                                                                "custo_extra",
                                                                parseFloat(e.target.value) || 0
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Fotos do Problema</Label>
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={(e) => handleArquivoProblema(problema.id, e.target.files)}
                                                    />
                                                    {problema.arquivos && problema.arquivos.length > 0 && (
                                                        <div className="space-y-2">
                                                            {problema.arquivos.map((arquivo: File, index: number) => (
                                                                <div
                                                                    key={index}
                                                                    className="flex items-center justify-between rounded border p-2"
                                                                >
                                                                    <span className="text-sm">{arquivo.name}</span>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => removerArquivoProblema(problema.id, index)}
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}

                                    {problemas.length === 0 && (
                                        <Card className="p-8 text-center">
                                            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">
                                                Nenhum problema adicionado. Clique em "Adicionar Problema" para
                                                registrar os problemas ocorridos.
                                            </p>
                                        </Card>
                                    )}
                                </div>
                            )}

                            {/* Funcionário Responsável pelo Registro */}
                            <div className="space-y-2">
                                <Label>Funcionário Responsável pelo Registro *</Label>
                                <Select value={funcionarioResponsavel} onValueChange={setFuncionarioResponsavel}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o funcionário" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {funcionarios.map((func) => (
                                            <SelectItem key={func.id} value={func.id}>
                                                {func.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Termo de Responsabilidade */}
                            <div className="space-y-2 rounded-lg border p-4">
                                <Label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={termoAceito}
                                        onChange={(e) => setTermoAceito(e.target.checked)}
                                        className="h-4 w-4"
                                    />
                                    <span className="text-sm">
                                        Aceito o termo de responsabilidade e confirmo que todas as
                                        informações prestadas são verdadeiras *
                                    </span>
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Ao aceitar este termo, você confirma que todas as informações
                                    fornecidas neste registro são verdadeiras e precisas. Este registro
                                    será salvo com data e hora para fins de auditoria.
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setModalAberto(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleFinalizar} disabled={salvando}>
                                {salvando ? "Salvando..." : "Finalizar Serviço"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    )
}
