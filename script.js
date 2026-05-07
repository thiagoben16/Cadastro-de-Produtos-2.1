// CONFIGURAÇÃO (Mantida)
const supabaseUrl = 'https://nzgqqrgeatfynstjvdyn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Z3FxcmdlYXRmeW5zdGp2ZHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MTExMzYsImV4cCI6MjA5MzQ4NzEzNn0.GZqcEr43UJjJzWChh8m8C7FKEcTFSOrgwlgWGMrHNdQ';

const supaBase = supabase.createClient(supabaseUrl, supabaseKey);

let lista_Produtos = [];
let planilha = null;
let contaneirForm = document.querySelector(".conteiner-main");

async function carregarDadosBanco() {
    const { data, error } = await supaBase.from('produtos').select('*');
    if (!error && data) {
        lista_Produtos = data;
    }
}

// Botões de interface
const btnFormulario = document.createElement('button');
btnFormulario.className = 'botao-formulario';
btnFormulario.innerText = 'Cadastrar Produto';
contaneirForm.appendChild(btnFormulario);

const btnBuscar = document.createElement('button');
btnBuscar.className = 'botao-buscar';
btnBuscar.innerText = 'Buscar Produto';
contaneirForm.appendChild(btnBuscar);

const botaoVoltar = document.querySelector('#botao-voltar');

function cadastrarprodutos() {
    btnFormulario.addEventListener('click', (e) => {
        e.preventDefault();
        btnFormulario.classList.add('hidden');
        btnBuscar.classList.add('hidden');
        document.querySelector('#container-formulario').classList.remove('hidden');

        if (!planilha) {
            planilha = document.createElement('div');
            planilha.className = 'container-planilha';
            document.body.appendChild(planilha);

            let tabela = document.createElement('table');
            tabela.className = 'container-tabela';
            planilha.appendChild(tabela);
            
            tabela.innerHTML = `
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Produto</th>
                        <th>Descrição</th>                     
                        <th>Preço</th>
                        <th>Qtd</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="corpo-tabela-principal"></tbody>
            `;

            lista_Produtos.forEach(p => renderizarLinha(p));

            const formulario = document.querySelector('form');
            formulario.addEventListener('submit', async (e) => {
                e.preventDefault();

                const dados = {
                    id: Date.now(),
                    produto: document.getElementById('produto').value,
                    descricao: document.getElementById('descricao').value,
                    preco: parseFloat(document.getElementById('preco').value.replace(',', '.')),
                    quantidade: 1 
                };

                const { error } = await supaBase.from('produtos').insert([dados]);
                if (error) {
                    console.error("Erro ao inserir:", error);
                } else {
                    lista_Produtos.push(dados);
                    renderizarLinha(dados); 
                    formulario.reset();
                }
            });
        } else {
            planilha.classList.remove('hidden');
            const corpo = document.getElementById('corpo-tabela-principal');
            corpo.innerHTML = '';
            lista_Produtos.forEach(p => renderizarLinha(p));
        }
    });

    botaoVoltar.addEventListener('click', () => {
        document.querySelector('#container-formulario').classList.add('hidden');
        if (planilha) planilha.classList.add('hidden');
        btnFormulario.classList.remove('hidden');
        btnBuscar.classList.remove('hidden');
    });
}

function renderizarLinha(produto) {
    const corpoTabela = document.getElementById('corpo-tabela-principal');
    if (!corpoTabela) return;

    const linha = document.createElement('tr');
    linha.id = `linha-${produto.id}`;
    
    linha.innerHTML = `
        <td>${produto.id}</td>
        <td>${produto.produto}</td>
        <td>${produto.descricao}</td>                    
        <td>R$ ${Number(produto.preco).toFixed(2)}</td>
        <td class="qtd-valor">${produto.quantidade}</td>
        <td>
            <button class="btn-mais" onclick="alterarQuantidade('${produto.id}', 1)"> + </button>
            <button class="btn-menos" onclick="alterarQuantidade('${produto.id}', -1)"> - </button>
        </td>
    `;
    corpoTabela.appendChild(linha);
}

window.alterarQuantidade = async function(id, mudanca) {
    const pIndex = lista_Produtos.findIndex(p => p.id == id);
    if (pIndex === -1) return;

    const produto = lista_Produtos[pIndex];
    let novaQtd = parseInt(produto.quantidade) + mudanca;

    if (novaQtd <= 0) {
        const confirmar = confirm(`Deseja remover "${produto.produto}"?`);
        if (confirmar) {
            const { error } = await supaBase.from('produtos').delete().eq('id', id);
            if (!error) {
                document.getElementById(`linha-${id}`)?.remove();
                lista_Produtos.splice(pIndex, 1);
            }
        }
    } else {
        const { error } = await supaBase.from('produtos').update({ quantidade: novaQtd }).eq('id', id);
        if (!error) {
            produto.quantidade = novaQtd;
            const campoQtd = document.getElementById(`linha-${id}`)?.querySelector('.qtd-valor');
            if (campoQtd) campoQtd.innerText = novaQtd;
        }
    }
};

// --- FUNÇÃO DE BUSCA ATUALIZADA (ID ou Nome) ---
function buscarprodutos() {
    btnBuscar.addEventListener('click', () => {
        btnFormulario.classList.add('hidden');
        btnBuscar.classList.add('hidden');

        let buscador = document.querySelector('.form-buscador');
        if(!buscador) {
            buscador = document.createElement('form');
            buscador.className = 'form-buscador';
            // Adicionado campo de busca por Nome
            buscador.innerHTML = `
                <input id='busca-id' type="text" placeholder="ID...">
                <input id='busca-nome' type="text" placeholder="Nome do produto...">
                <button type="button" id="btn-executar-busca">Buscar</button>
                <button type="button" id="btn-cancelar-busca">Voltar</button>
            `;
            contaneirForm.appendChild(buscador);
        }

        document.getElementById('btn-cancelar-busca').onclick = () => {
            document.querySelector('.container-resultado-cards')?.remove();
            buscador.remove();
            btnBuscar.classList.remove('hidden');
            btnFormulario.classList.remove('hidden');
        };

        document.getElementById('btn-executar-busca').onclick = () => {
            let idBuscado = document.getElementById('busca-id').value;
            let nomeBuscado = document.getElementById('busca-nome').value.toLowerCase();
            
            // Lógica de busca: tenta por ID primeiro, se não tiver ID, tenta por Nome
            let p;
            if (idBuscado) {
                p = lista_Produtos.find(item => item.id == idBuscado);
            } else if (nomeBuscado) {
                p = lista_Produtos.find(item => item.produto.toLowerCase().includes(nomeBuscado));
            }
            
            document.querySelector('.container-resultado-cards')?.remove();

            if (p) {
                let resDiv = document.createElement('div');
                resDiv.className = 'container-resultado-cards';
                resDiv.innerHTML = `
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 20px;">
                        <div class="card-info" style="background: white; color: #1a2a6c; padding: 15px; border-radius: 10px; font-weight: bold; box-shadow: 4px 4px 10px rgba(0,0,0,0.2);">ID: ${p.id}</div>
                        <div class="card-info" style="background: white; color: #1a2a6c; padding: 15px; border-radius: 10px; font-weight: bold; box-shadow: 4px 4px 10px rgba(0,0,0,0.2);">${p.produto}</div>
                        <div class="card-info" style="background: white; color: #1a2a6c; padding: 15px; border-radius: 10px; font-weight: bold; box-shadow: 4px 4px 10px rgba(0,0,0,0.2);">${p.descricao}</div>
                        <div class="card-info" style="background: white; color: #1a2a6c; padding: 15px; border-radius: 10px; font-weight: bold; box-shadow: 4px 4px 10px rgba(0,0,0,0.2);">R$ ${Number(p.preco).toFixed(2)}</div>
                        <div class="card-info" style="background: white; color: #1a2a6c; padding: 15px; border-radius: 10px; font-weight: bold; box-shadow: 4px 4px 10px rgba(0,0,0,0.2);">Qtd: ${p.quantidade}</div>
                    </div>`;
                contaneirForm.appendChild(resDiv);
            } else {
                alert("Produto não encontrado!");
            }
        };
    });
}

carregarDadosBanco().then(() => {
    cadastrarprodutos();
    buscarprodutos();
});