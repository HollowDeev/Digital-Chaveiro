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
    const { servicosRealizados, loading, refetch, removeServicoLocal } = useServicosRealizados(lojaId)
    const { motivos } = useMotivosProblemas(lojaId)
    const { funcionarios } = useFuncionarios(lojaId)

    const [busca, setBusca] = useState("")
    const [modalAberto, setModalAberto] = useState(false)
    const [modalRemover, setModalRemover] = useState(false)
    const [servicoParaRemover, setServicoParaRemover] = useState<any>(null)
    const [motivoRemocao, setMotivoRemocao] = useState("")
    const [servicoSelecionado, setServicoSelecionado] = useState<any>(null)
    const [ocorreuPerfeitamente, setOcorreuPerfeitamente] = useState<boolean | null>(null)
    const [problemas, setProblemas] = useState<any[]>([])
    const [problemasSalvos, setProblemasSalvos] = useState<any[]>([])
    const [arquivosComprovacao, setArquivosComprovacao] = useState<File[]>([])
    const [funcionarioResponsavel, setFuncionarioResponsavel] = useState("")
    const [termoAceito, setTermoAceito] = useState(false)
    const [salvando, setSalvando] = useState(false)
    const [servicoPago, setServicoPago] = useState(false)
    const [formaPagamento, setFormaPagamento] = useState<"dinheiro" | "cartao_credito" | "cartao_debito" | "pix" | "outros" | "aprazo">("dinheiro")
    const [tipoFinalizacao, setTipoFinalizacao] = useState<"salvar_problemas" | "finalizar" | null>(null)
    const [fotoSelecionada, setFotoSelecionada] = useState<any>(null)
    const [modalFoto, setModalFoto] = useState(false)
    const [fotosComprovacao, setFotosComprovacao] = useState<any[]>([])

    // Separar serviços por status
    const servicosAbertos = servicosRealizados.filter(
        (s) => s.status === "aberto" || s.status === "em_andamento"
    )
    const servicosFinalizados = servicosRealizados.filter((s) => s.status === "finalizado")

    console.log("Total de serviços:", servicosRealizados.length)
    console.log("Serviços abertos:", servicosAbertos.length)
    console.log("Serviços finalizados:", servicosFinalizados.length)
    console.log("Todos os serviços:", servicosRealizados.map(s => ({ id: s.id, status: s.status, nome: s.servico?.nome })))

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
        setOcorreuPerfeitamente(servico.problemas_salvos ? null : null)
        setProblemas([])
        setArquivosComprovacao([])
        setFuncionarioResponsavel("")
        setTermoAceito(false)
        setServicoPago(servico.pago || false)
        setFormaPagamento("dinheiro")
        setTipoFinalizacao(null)

        // Carregar problemas e fotos de comprovação salvos anteriormente
        carregarProblemasSalvos(servico.id)
        carregarFotosComprovacao(servico.id)
    }

    const downloadArquivo = async (arquivo: any) => {
        try {
            const supabase = createClient()

            // Extrair o caminho do arquivo da URL
            const urlParts = arquivo.url.split('/servicos-arquivos/')
            if (urlParts.length !== 2) {
                throw new Error("URL inválida")
            }
            const caminhoArquivo = urlParts[1]

            console.log("Tentando baixar:", caminhoArquivo)

            // Usar o método download do Supabase
            const { data, error } = await supabase.storage
                .from('servicos-arquivos')
                .download(caminhoArquivo)

            if (error) {
                console.error("Erro no download do Supabase:", error)
                throw error
            }

            if (data) {
                const url = window.URL.createObjectURL(data)
                const a = document.createElement('a')
                a.href = url
                a.download = arquivo.nome_arquivo
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
                alert("Arquivo baixado com sucesso!")
            }
        } catch (error) {
            console.error("Erro ao baixar arquivo:", error)
            alert("Erro ao baixar arquivo. Tente novamente.")
        }
    }

    const carregarProblemasSalvos = async (servicoId: string) => {
        try {
            const supabase = createClient()

            // Carregar problemas
            const { data: problemas, error: problemasError } = await supabase
                .from("servicos_problemas")
                .select("*")
                .eq("servico_realizado_id", servicoId)

            if (problemasError) {
                console.error("Erro ao carregar problemas:", problemasError)
                throw problemasError
            }

            // Enriquecer problemas com motivos e arquivos
            const problemasEnriquecidos = await Promise.all(
                (problemas || []).map(async (problema) => {
                    // Carregar motivo
                    const { data: motivo } = await supabase
                        .from("motivos_problemas_servicos")
                        .select("id, nome")
                        .eq("id", problema.motivo_id)
                        .single()

                    // Carregar arquivos APENAS do problema específico
                    const { data: arquivos } = await supabase
                        .from("servicos_arquivos")
                        .select("id, url, nome_arquivo, tipo")
                        .eq("servico_realizado_id", servicoId)
                        .eq("tipo", "problema")

                    console.log(`Arquivos para problema ${problema.id}:`, arquivos)

                    return {
                        ...problema,
                        motivo: motivo,
                        arquivos: arquivos || []
                    }
                })
            )

            setProblemasSalvos(problemasEnriquecidos)
            console.log("Problemas salvos carregados:", problemasEnriquecidos)
        } catch (error: any) {
            console.error("Erro ao carregar problemas salvos:", error)
            setProblemasSalvos([])
        }
    }

    const carregarFotosComprovacao = async (servicoId: string) => {
        try {
            const supabase = createClient()

            const { data: arquivos, error } = await supabase
                .from("servicos_arquivos")
                .select("id, url, nome_arquivo, tipo")
                .eq("servico_realizado_id", servicoId)
                .eq("tipo", "comprovacao")

            if (error) {
                console.error("Erro ao carregar fotos de comprovação:", error)
                return
            }

            setFotosComprovacao(arquivos || [])
            console.log("Fotos de comprovação carregadas:", arquivos)
        } catch (error: any) {
            console.error("Erro ao carregar fotos de comprovação:", error)
            setFotosComprovacao([])
        }
    }

    const handleRemoverClick = (servico: any) => {
        setServicoParaRemover(servico)
        setModalRemover(true)
        setMotivoRemocao("")
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

    const uploadArquivo = async (file: File, servicoId: string, tipo: string) => {
        const supabase = createClient()
        const fileExt = file.name.split(".").pop()
        const fileName = `${servicoId}/${tipo}-${Date.now()}.${fileExt}`

        const { data, error } = await supabase.storage
            .from("servicos-arquivos")
            .upload(fileName, file)

        if (error) throw error

        const { data: publicUrlData } = supabase.storage.from("servicos-arquivos").getPublicUrl(fileName)

        console.log("URL pública gerada:", publicUrlData.publicUrl)

        return { url: publicUrlData.publicUrl, nome_arquivo: file.name }
    }

    const validarProblemas = (problemas: any[]): { valido: boolean; mensagem: string } => {
        for (let i = 0; i < problemas.length; i++) {
            const problema = problemas[i]
            if (!problema.motivo_id || problema.motivo_id.trim() === "") {
                return { valido: false, mensagem: `Problema ${i + 1}: Selecione o motivo do problema` }
            }
            if (!problema.culpado || problema.culpado.trim() === "") {
                return { valido: false, mensagem: `Problema ${i + 1}: Selecione o culpado` }
            }
            if (!problema.descricao || problema.descricao.trim() === "") {
                return { valido: false, mensagem: `Problema ${i + 1}: Preencha a descrição do problema` }
            }
            if (problema.culpado === "funcionario" && (!problema.culpado_funcionario_id || problema.culpado_funcionario_id.trim() === "")) {
                return { valido: false, mensagem: `Problema ${i + 1}: Selecione o funcionário responsável` }
            }
        }
        return { valido: true, mensagem: "" }
    }

    const handleSalvarProblemas = async () => {
        if (!ocorreuPerfeitamente === false || problemas.length === 0) {
            alert("Adicione pelo menos um problema antes de salvar")
            return
        }

        // Validar todos os problemas antes de salvar
        const validacao = validarProblemas(problemas)
        if (!validacao.valido) {
            alert(validacao.mensagem)
            return
        }

        setSalvando(true)

        try {
            const supabase = createClient()
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) throw new Error("Usuário não autenticado")

            // Registrar problemas
            for (const problema of problemas) {
                const problemaData: any = {
                    servico_realizado_id: servicoSelecionado.id,
                    motivo_id: problema.motivo_id,
                    culpado: problema.culpado,
                    descricao: problema.descricao,
                    custo_extra: problema.custo_extra || 0,
                    registrado_por: user.id,
                    termo_aceito: true,
                    termo_aceito_em: new Date().toISOString(),
                }

                // Só adiciona culpado_funcionario_id se for funcionário e tiver ID válido
                if (problema.culpado === "funcionario" && problema.culpado_funcionario_id && problema.culpado_funcionario_id.trim() !== "") {
                    problemaData.culpado_funcionario_id = problema.culpado_funcionario_id
                }

                console.log("Dados do problema a serem salvos:", problemaData)

                const { data: problemaInserted, error: problemaError } = await supabase
                    .from("servicos_problemas")
                    .insert(problemaData)
                    .select()
                    .single()

                if (problemaError) throw problemaError

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

            // Atualizar flag problemas_salvos
            await supabase
                .from("servicos_realizados")
                .update({ problemas_salvos: true })
                .eq("id", servicoSelecionado.id)

            alert("Problemas salvos com sucesso! Você pode finalizar o serviço posteriormente.")
            setModalAberto(false)
            refetch()
        } catch (error: any) {
            console.error("Erro ao salvar problemas:", error)
            alert(`Erro ao salvar problemas: ${error?.message || "Erro desconhecido"}`)
        } finally {
            setSalvando(false)
        }
    }

    const handleFinalizar = async () => {
        if (!funcionarioResponsavel || !termoAceito) {
            alert("Preencha todos os campos obrigatórios e aceite o termo de responsabilidade")
            return
        }

        if (!servicoSelecionado.pago && !servicoPago) {
            alert("Marque o serviço como pago antes de finalizar")
            return
        }

        // Se o serviço já teve problemas salvos, pode finalizar sem preencher "ocorreu perfeitamente"
        if (!servicoSelecionado.problemas_salvos) {
            if (ocorreuPerfeitamente === null) {
                alert("Informe se o serviço ocorreu perfeitamente")
                return
            }

            if (!ocorreuPerfeitamente && problemas.length === 0) {
                alert("Adicione pelo menos um problema reportado")
                return
            }

            // Validar os problemas antes de finalizar
            if (!ocorreuPerfeitamente && problemas.length > 0) {
                const validacao = validarProblemas(problemas)
                if (!validacao.valido) {
                    alert(validacao.mensagem)
                    return
                }
            }
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
                    pago: true,
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

                    const problemaData: any = {
                        servico_realizado_id: servicoSelecionado.id,
                        motivo_id: problema.motivo_id,
                        culpado: problema.culpado,
                        descricao: problema.descricao,
                        custo_extra: problema.custo_extra || 0,
                        registrado_por: user.id,
                        termo_aceito: true,
                        termo_aceito_em: new Date().toISOString(),
                    }

                    // Só adiciona culpado_funcionario_id se for funcionário e tiver ID válido
                    if (problema.culpado === "funcionario" && problema.culpado_funcionario_id && problema.culpado_funcionario_id.trim() !== "") {
                        problemaData.culpado_funcionario_id = problema.culpado_funcionario_id
                    }

                    console.log("Dados do problema a serem salvos:", problemaData)

                    const { data: problemaInserted, error: problemaError } = await supabase
                        .from("servicos_problemas")
                        .insert(problemaData)
                        .select()
                        .single()

                    if (problemaError) {
                        console.error("Erro ao inserir problema:", problemaError)
                        throw problemaError
                    }

                    console.log("Problema registrado:", problemaInserted)

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

    const handleRemover = async () => {
        if (!motivoRemocao.trim()) {
            alert("Informe o motivo da remoção")
            return
        }

        setSalvando(true)

        try {
            const supabase = createClient()
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) throw new Error("Usuário não autenticado")

            // Buscar dados completos do serviço
            const { data: servicoCompleto } = await supabase
                .from("servicos_realizados")
                .select(`
                    *,
                    servico:servicos(*),
                    cliente:clientes(*),
                    venda:vendas(*)
                `)
                .eq("id", servicoParaRemover.id)
                .single()

            // Inserir na tabela de removidos
            const { error: insertError } = await supabase
                .from("servicos_removidos")
                .insert({
                    servico_realizado_id: servicoParaRemover.id,
                    loja_id: servicoParaRemover.loja_id,
                    venda_id: servicoParaRemover.venda_id,
                    servico_id: servicoParaRemover.servico_id,
                    cliente_id: servicoParaRemover.cliente_id,
                    funcionario_responsavel_id: servicoParaRemover.funcionario_responsavel_id,
                    status: servicoParaRemover.status,
                    data_inicio: servicoParaRemover.data_inicio,
                    data_conclusao: servicoParaRemover.data_conclusao,
                    observacoes: servicoParaRemover.observacoes,
                    motivo_remocao: motivoRemocao,
                    removido_por: user.id,
                    dados_completos: servicoCompleto,
                })

            if (insertError) throw insertError

            // Deletar o serviço
            const { error: deleteError } = await supabase
                .from("servicos_realizados")
                .delete()
                .eq("id", servicoParaRemover.id)

            if (deleteError) throw deleteError

            alert("Serviço removido com sucesso!")
            setModalRemover(false)
            setMotivoRemocao("")
            setServicoParaRemover(null)
            // Atualiza imediatamente a lista local para sumir da UI
            removeServicoLocal(servicoParaRemover.id)

            console.log("Chamando refetch após remoção...")
            // Recarregar serviços
            await refetch()
            console.log("Refetch concluído")
        } catch (error: any) {
            console.error("Erro ao remover serviço:", error)
            alert(`Erro ao remover serviço: ${error?.message || "Erro desconhecido"}`)
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
                                                Verificar
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
                                    <Card key={servico.id} className="p-4 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 space-y-2">
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
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleRemoverClick(servico)}
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Remover
                                            </Button>
                                        </div>

                                        {/* Fotos de Comprovação */}
                                        {servico.fotos_comprovacao && servico.fotos_comprovacao.length > 0 && (
                                            <div className="border-t pt-4 space-y-2">
                                                <p className="text-sm font-semibold">Fotos de Conclusão:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {servico.fotos_comprovacao.map((foto) => (
                                                        <div key={foto.id} className="space-y-1">
                                                            <img
                                                                src={foto.url}
                                                                alt={foto.nome_arquivo}
                                                                className="h-20 w-20 rounded border cursor-pointer hover:opacity-80 object-cover"
                                                                onClick={() => {
                                                                    setFotoSelecionada(foto)
                                                                    setModalFoto(true)
                                                                }}
                                                                onError={(e) => {
                                                                    if (!e.currentTarget.src.includes('?t=')) {
                                                                        e.currentTarget.src = foto.url + '?t=' + Date.now()
                                                                    } else {
                                                                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23e6ffe6' width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' font-size='10' fill='%23009900' text-anchor='middle' dy='.3em'%3E✓%3C/text%3E%3C/svg%3E"
                                                                    }
                                                                }}
                                                            />
                                                            <button
                                                                onClick={() => downloadArquivo(foto)}
                                                                className="text-xs text-blue-600 hover:underline block text-center w-full"
                                                                title="Baixar imagem"
                                                            >
                                                                Baixar
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
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
                            {/* Pergunta Principal - Só aparece se ainda não teve problemas salvos */}
                            {!servicoSelecionado?.problemas_salvos && (
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
                            )}

                            {/* Alerta quando já teve problemas salvos */}
                            {servicoSelecionado?.problemas_salvos && (
                                <Card className="border-orange-200 bg-orange-50 p-4">
                                    <p className="text-sm text-orange-800">
                                        <AlertCircle className="inline mr-2 h-4 w-4" />
                                        Este serviço já teve problemas registrados anteriormente.
                                        Finalize marcando o pagamento e o funcionário responsável.
                                    </p>
                                </Card>
                            )}

                            {/* Exibir Problemas Salvos */}
                            {problemasSalvos.length > 0 && (
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold">Problemas Registrados</Label>
                                    {problemasSalvos.map((problema) => (
                                        <Card key={problema.id} className="border-orange-200 bg-orange-50 p-4 space-y-3">
                                            <div className="space-y-2">
                                                <p className="text-sm"><strong>Motivo:</strong> {problema.motivo?.nome || problema.motivo_id}</p>
                                                <p className="text-sm"><strong>Culpado:</strong> {problema.culpado}</p>
                                                <p className="text-sm"><strong>Descrição:</strong> {problema.descricao}</p>
                                                {problema.custo_extra > 0 && (
                                                    <p className="text-sm"><strong>Custo Extra:</strong> R$ {problema.custo_extra.toFixed(2)}</p>
                                                )}
                                            </div>

                                            {/* Exibir fotos do problema */}
                                            {problema.arquivos && problema.arquivos.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium">Fotos:</p>
                                                    {console.log(`Arquivos para ${problema.id}:`, problema.arquivos)}
                                                    <div className="flex flex-wrap gap-2">
                                                        {problema.arquivos.map((arquivo) => (
                                                            <div key={arquivo.id} className="space-y-1">
                                                                <div className="text-xs text-gray-500 mb-1">
                                                                    {/* Debug: mostrar URL */}
                                                                    {/* {arquivo.url} */}
                                                                </div>
                                                                <img
                                                                    src={arquivo.url}
                                                                    alt={arquivo.nome_arquivo}
                                                                    className="h-20 w-20 rounded border cursor-pointer hover:opacity-80 object-cover"
                                                                    onClick={() => {
                                                                        setFotoSelecionada(arquivo)
                                                                        setModalFoto(true)
                                                                    }}
                                                                    onError={(e) => {
                                                                        console.error("Erro ao carregar imagem:", {
                                                                            url: arquivo.url,
                                                                            nome: arquivo.nome_arquivo
                                                                        })
                                                                        // Tentar uma versão alternativa da URL
                                                                        if (!e.currentTarget.src.includes('?t=')) {
                                                                            e.currentTarget.src = arquivo.url + '?t=' + Date.now()
                                                                        } else {
                                                                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23ffcccc' width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' font-size='10' fill='%23cc0000' text-anchor='middle' dy='.3em'%3E❌%3C/text%3E%3C/svg%3E"
                                                                        }
                                                                    }}
                                                                />
                                                                <button
                                                                    onClick={() => downloadArquivo(arquivo)}
                                                                    className="text-xs text-blue-600 hover:underline block text-center w-full"
                                                                    title="Baixar imagem"
                                                                >
                                                                    Baixar
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            )}

                            {/* Opção para adicionar mais problemas */}
                            {servicoSelecionado?.problemas_salvos && (
                                <div className="space-y-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setOcorreuPerfeitamente(false)}
                                        className="w-full"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Adicionar Mais Problemas
                                    </Button>
                                </div>
                            )}

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

                            {/* Exibir Fotos de Comprovação Já Salvas */}
                            {fotosComprovacao.length > 0 && (
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold">Fotos de Comprovação do Serviço</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {fotosComprovacao.map((foto) => (
                                            <div key={foto.id} className="space-y-1">
                                                <img
                                                    src={foto.url}
                                                    alt={foto.nome_arquivo}
                                                    className="h-20 w-20 rounded border cursor-pointer hover:opacity-80 object-cover"
                                                    onClick={() => {
                                                        setFotoSelecionada(foto)
                                                        setModalFoto(true)
                                                    }}
                                                    onError={(e) => {
                                                        console.error("Erro ao carregar imagem:", {
                                                            url: foto.url,
                                                            nome: foto.nome_arquivo
                                                        })
                                                        // Tentar com cache busting
                                                        if (!e.currentTarget.src.includes('?t=')) {
                                                            e.currentTarget.src = foto.url + '?t=' + Date.now()
                                                        } else {
                                                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23e6ffe6' width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' font-size='10' fill='%23009900' text-anchor='middle' dy='.3em'%3E✓%3C/text%3E%3C/svg%3E"
                                                        }
                                                    }}
                                                />
                                                <button
                                                    onClick={() => downloadArquivo(foto)}
                                                    className="text-xs text-blue-600 hover:underline block text-center w-full"
                                                    title="Baixar imagem"
                                                >
                                                    Baixar
                                                </button>
                                            </div>
                                        ))}
                                    </div>
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
                                                    <Label>Motivo do Problema *</Label>
                                                    {motivos.length === 0 ? (
                                                        <div className="p-3 border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                                                            <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                                                ⚠️ Nenhum motivo cadastrado. Execute o script SQL 045_seed_motivos_problemas.sql no Supabase para criar os motivos padrão.
                                                            </p>
                                                        </div>
                                                    ) : (
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
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Culpado *</Label>
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

                            {/* Status de Pagamento */}
                            <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                                <Label className="text-base font-semibold">Pagamento do Serviço *</Label>
                                {servicoSelecionado?.pago ? (
                                    <p className="text-sm text-green-600 font-medium">
                                        ✓ Serviço já foi pago antecipadamente
                                    </p>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={servicoPago}
                                                onChange={(e) => setServicoPago(e.target.checked)}
                                                className="h-4 w-4"
                                                id="servicoPago"
                                            />
                                            <Label htmlFor="servicoPago" className="cursor-pointer">
                                                Marcar como pago
                                            </Label>
                                        </div>
                                        {servicoPago && (
                                            <div className="space-y-2 mt-3">
                                                <Label>Forma de Pagamento</Label>
                                                <Select value={formaPagamento} onValueChange={(value: any) => setFormaPagamento(value)}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                                        <SelectItem value="pix">PIX</SelectItem>
                                                        <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                                                        <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                                                        <SelectItem value="aprazo">A Prazo</SelectItem>
                                                        <SelectItem value="outros">Outros</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                        {!servicoPago && (
                                            <p className="text-sm text-orange-600">
                                                ⚠️ O serviço precisa ser marcado como pago para ser finalizado
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>

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

                        <DialogFooter className="flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={() => setModalAberto(false)}>
                                Cancelar
                            </Button>
                            {/* Botão para salvar problemas sem finalizar - só aparece se tiver problemas novos e ainda não finalizou */}
                            {ocorreuPerfeitamente === false && problemas.length > 0 && !servicoSelecionado?.problemas_salvos && (
                                <Button
                                    variant="secondary"
                                    onClick={handleSalvarProblemas}
                                    disabled={salvando}
                                >
                                    {salvando ? "Salvando..." : "Salvar Problemas (Finalizar Depois)"}
                                </Button>
                            )}
                            {/* Botão para salvar mais problemas após já ter alguns salvos */}
                            {ocorreuPerfeitamente === false && problemas.length > 0 && servicoSelecionado?.problemas_salvos && (
                                <Button
                                    variant="secondary"
                                    onClick={handleSalvarProblemas}
                                    disabled={salvando}
                                >
                                    {salvando ? "Salvando..." : "Salvar Mais Problemas"}
                                </Button>
                            )}
                            <Button onClick={handleFinalizar} disabled={salvando}>
                                {salvando ? "Salvando..." : "Finalizar Serviço"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Modal de Visualização de Foto */}
                <Dialog open={modalFoto} onOpenChange={setModalFoto}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Visualizar Foto</DialogTitle>
                        </DialogHeader>
                        {fotoSelecionada && (
                            <div className="space-y-4">
                                <img
                                    src={fotoSelecionada.url}
                                    alt={fotoSelecionada.nome_arquivo}
                                    className="w-full rounded-lg max-h-96 object-contain"
                                    onError={(e) => {
                                        console.error("Erro ao carregar imagem no modal:", fotoSelecionada.url)
                                        // Tentar com cache busting
                                        if (!e.currentTarget.src.includes('?t=')) {
                                            e.currentTarget.src = fotoSelecionada.url + '?t=' + Date.now()
                                        } else {
                                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ffe0e0' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='20' fill='%23cc0000' text-anchor='middle' dy='.3em'%3E❌ Erro ao carregar imagem%3C/text%3E%3C/svg%3E"
                                        }
                                    }}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setModalFoto(false)}
                                        className="flex-1"
                                    >
                                        Fechar
                                    </Button>
                                    <Button
                                        onClick={() => downloadArquivo(fotoSelecionada)}
                                        className="flex-1"
                                    >
                                        Baixar Foto
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Modal de Remoção */}
                <Dialog open={modalRemover} onOpenChange={setModalRemover}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Remover Serviço</DialogTitle>
                            <DialogDescription>
                                Tem certeza que deseja remover este serviço? Esta ação não pode ser desfeita.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Motivo da Remoção *</Label>
                                <Textarea
                                    value={motivoRemocao}
                                    onChange={(e) => setMotivoRemocao(e.target.value)}
                                    placeholder="Ex: Serviço executado incorretamente, duplicidade, erro de registro..."
                                    rows={4}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                O serviço será movido para uma tabela de serviços removidos e poderá ser consultado posteriormente para auditoria.
                            </p>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setModalRemover(false)}>
                                Cancelar
                            </Button>
                            <Button variant="destructive" onClick={handleRemover} disabled={salvando}>
                                {salvando ? "Removendo..." : "Confirmar Remoção"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    )
}
