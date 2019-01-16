import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { List } from "react-virtualized";
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
// import Chance from 'chance';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons'

library.add([faEdit, faTrash]);

// const rowCount = 10;
// const chance = new Chance();

class App extends Component {

  constructor() {
    super();

    let list = [];
    // mock data
    // let list = Array(rowCount).fill().map((val, idx) => {
    //   return {
    //     id: idx, 
    //     name: chance.name(),
    //     email: chance.email(),
    //     amigo: ''
    //   }
    // });

    this.state = {
      modal: false,
      form: {
        id: '',
        name: '',
        email: '',
        amigo: ''
      },
      list : list,
      response: ''
    };

    this.toggle = this.toggle.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.remove = this.remove.bind(this);
    this.edit = this.edit.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.sorter = this.sorter.bind(this);
  }

  getList(){
    this.callApi()
      .then(res => {
        this.setState({ list: res })
      })
      .catch(err => console.log(err));
  }

  componentDidMount() {
    this.getList();
  }

  callApi = async () => {
    const response = await fetch('/amigos');
    const body = await response.json();

    if (response.status !== 200) throw Error(body);

    return body;
  };


  shuffleArray(array) {
      for (var i = array.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var temp = array[i];
          array[i] = array[j];
          array[j] = temp;
      }
      return array;
  }


  // logica bem simples
  // basicamente embaralha a lista
  // sorteado é o next do participante
  sorter(){

    let list = this.shuffleArray(this.state.list);

    // se tiver 1 ou 0 pessoas o sorteio nao ocorre!
    if(list.length <= 1){
      alert('Numero de participantes inválido');
      return false;
    }

    var headers = new Headers();
    headers.append('Accept', 'application/json'); // This one is enough for GET requests
    headers.append('Content-Type', 'application/json'); // This one sends body

    let promises = [];
    let promisesSendMail = [];
    let listEmails = [];
    let counter = 0;
    let len = list.length;

    for(var x=0;x<len;x++){

      counter = (x+1 >= len ? 0 : x+1);

      let participante = list[x];
      let amigo = list[counter];

      participante.amigo = amigo._id;

      // aqui eu ja faco uma listinha pra poder mandar os emails
      listEmails.push({
          from: 'site@hagility.com.br',
          to: participante.email,
          subject: 'AMIGO SECRETO - REACT',
          html: `${participante.name} - você sorteou o amigo ${amigo.name} - no amigo secreto`,        
      })

      promises.push(fetch(`/amigo/${participante._id}`,{
          method: 'PUT',
          headers: headers,
          body: JSON.stringify(participante)
      }))
    }

    //depois que eu faco o sorteio, eu vou percorrer a lista pra enviar os emails
    Promise.all(promises).then(resp => {
    
      listEmails.forEach(email => {
          promisesSendMail.push(fetch('/sendMail',{
          method: 'POST',
          headers: headers,
          body: JSON.stringify(email)
        }));
      });

      console.log('promisesSendMail => ', promisesSendMail);
      Promise.all(promisesSendMail).then(resp => {
        console.log('fim resp => ', resp);
      });

      alert('O Sorteio foi realizado e os participantes receberam um e-mail com seus respectivos sorteados');
      this.getList();
    });
  }

  toggle() {

    this.resetForm();
    this.setState({
      modal: !this.state.modal
    });
  }

  resetForm(){    
      var state = this.state;
      this.setState({
        ...state,
        form: {
          id: '',
          name: '',
          email: ''
        }
      });
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;

    let form = {
      ...this.state.form,
      [name]:value
    };
    
    this.setState({form});
  }

  onSubmit(event){

    event.preventDefault();

    // se tem ID, só atualiza
    let id = document.getElementById("id");
    //let list = this.state.list;
    let url = (id.value ? `/amigo/${id.value}` : '/amigo');
    let method = (id.value ? 'PUT' : 'POST');


    // aqui eu poderia atualizar só a listinha, mas pra deixar padrao, eu vou chamar o getList()
    // if(id.value){
    //   list[id.value] = this.state.form;      
    // }else{
      
      var payload = {
        name: this.state.form.name,
        email: this.state.form.email
      };
    //}

    var headers = new Headers();

    headers.append('Accept', 'application/json'); // This one is enough for GET requests
    headers.append('Content-Type', 'application/json'); // This one sends body

    fetch(url,
    {
        method: method,
        headers: headers,
        body: JSON.stringify(payload)
    }).then(resp => {
      return (resp.json());
    }).then(data => {
      
      if(data.errmsg){
        alert(data.errmsg);
        return false;
      }
      // aqui pode fazer 2 maneiras...atualizar a listinha pra deixar mais rapido, ou chamar novamente o metodo  getList
      // list.push(data);
      // this.setState({
      //   ...list
      // });

      this.getList();
      this.toggle();
    })
  }

  edit(row){

    this.toggle();

    this.setState({
      form: {
        id: row._id,
        name: row.name,
        email: row.email
      }
    });
  }

  remove(id){

    if(window.confirm('Deseja realmente remover este registro?')){

      fetch(`/amigo/${id}`, {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id: id})
      })
      .then(res => res.text())
      .then(res => {
        
        // aqui eu podia retirar o item do array pra deixar mais rapido, mas como é só CRUD simples, to chamando a lista novamente
        this.getList();
      });
    }
  }

  renderRow({index, key, style}) {
    let row = this.state.list[index];
    return (
      <div key={key} style={style} className="list-row">
        <div className="content">
          <div>{row.name} - {row.email} - tirou = {row.amigo ? row.amigo.name : ''}</div>
          <div className="btn-group">
            <button type="button" title="editar" className="btn btn-sm btn-outline-primary" onClick={() => this.edit(row)}>
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button type="button" title="remover" className="btn btn-sm btn-outline-primary" onClick={() => this.remove(row._id)}>
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const listHeight = 600;
    const rowHeight = 50;
    return (
      <div className="App">
        <header className="App-header border-bottom">
          <nav className="navbar bg-light">
            <a className="navbar-brand" href="/">
              <img src={logo} width="30" height="30" className="d-inline-block align-top" alt="" />
              a<span className="d-none d-sm-inline">migo</span>-s<span className="d-none d-sm-inline">ecreto</span>
            </a>
            <div className="btn-group">
              <button className="btn btn-sm btn-outline-primary" onClick={this.toggle}>Adicionar Amigo</button>
              <button className="btn btn-sm btn-outline-primary" onClick={this.sorter}>Sortear</button>
            </div>
          </nav>
        </header>

        <p className="App-intro">{this.state.response}</p>

        <div className="list">
          <AutoSizer>
            {({ height, width }) => (
              <List
                width={width}
                height={listHeight}
                rowHeight={rowHeight}
                rowRenderer={this.renderRow.bind(this)}
                rowCount={this.state.list.length} />
            )}
          </AutoSizer>
        </div>


       <Modal isOpen={this.state.modal} toggle={this.toggle}>
          <form onSubmit={this.onSubmit}>
            <ModalHeader toggle={this.toggle}>Adicionar Amigo</ModalHeader>
            <ModalBody>
                <input className="form-control form-control-sm" defaultValue={this.state.form.id} name="id" id="id" type="hidden" />
                <div className="container-fluid">
                  <div className="row">
                    <div className="col-12">
                      <div className="form-group">
                        <label htmlFor="name">Nome</label>
                        <input className="form-control form-control-sm" onChange={this.handleInputChange} defaultValue={this.state.form.name || ''} name="name" id="name" type="text" />
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group">
                        <label htmlFor="email">E-mail</label>
                        <input className="form-control form-control-sm" onChange={this.handleInputChange} defaultValue={this.state.form.email || ''} name="email" id="email" type="email"  />
                      </div>
                    </div>
                  </div>
                </div>
            </ModalBody>
            <ModalFooter>
              <Button color="primary" type="submit">Salvar</Button>{' '}
              <Button color="secondary" onClick={this.toggle}>Cancelar</Button>
            </ModalFooter>
          </form>
        </Modal>


      </div>
    );
  }
}

export default App;
