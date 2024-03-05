var addingRows = document.getElementById('adding-rows') 
var money = 0
const socket = io();

  socket.on('messageToClient', (selectedBox, price) => {
    addingRows.innerHTML = ''
    selectedBox.forEach(element => {
      addingRows.innerHTML +=
        `
        <div class="row"> 
          <div class="cell">${element.title}</div>
          <div class="cell">${element.price}</div>
          <div class="cell">${element.size}</div>
        </div>
        `
        
    });
    money = price
    console.log(money)
    if(price==0){
      document.getElementById('price').innerHTML = `0.00€`  
    }else{
      document.getElementById('price').innerHTML = `${price.toFixed(2)}€`
    }
  });

  socket.on('reloadToClient', () => {
    location.href = location.href
  })

  
 

  socket.on('functionToClient', (data) => {
    document.getElementById('header').innerHTML='<input type="text" id="searchInput">'
    document.getElementById('reg-rows').innerHTML=
    `
    <div class="row" data-id="0" onclick="authorization('Narva Haigla')"> 
      <div class="name-cell">Narva Haigla</div>
    </div>
    <div class="row" data-id="50409013724" onclick="authorization('Deniss Mihhailov')"> 
      <div class="name-cell">Deniss Mihhailov</div>
    </div>
    <div class="row" data-id="2" onclick="authorization('Leonti Mishin')"> 
      <div class="name-cell">Leonti Mishin</div>
    </div>
    <div class="row" data-id="3" onclick="authorization('Andrei Belyaev')"> 
      <div class="name-cell">Andrei Belyaev</div>
    </div>
    <div class="row" data-id="4" onclick="authorization('Alexey Bystrov')"> 
      <div class="name-cell">Alexey Bystrov</div>
    </div>

    <div class="row no-results" style="display: none;"> 
      <div class="name-cell">Ничего не найдено</div>
    </div>
    `
    searchInput.addEventListener('input', search)

  })
  
  function authorization(name) {
  var closeModalBtn = document.getElementById('deny');
  var confirmModalBtn = document.getElementById('confirm');
  var modal = document.getElementById('myModal');
  var string = document.getElementById('string')
  
  modal.style.display = 'block';
  string.innerHTML = name
  
  closeModalBtn.addEventListener('click', function () {
    modal.style.display = 'none';
  });
  
  confirmModalBtn.addEventListener('click', function () {
    modal.style.display = 'none';
    socket.emit('messageFromClient', name)
    spinner()
  });
  
  window.addEventListener('click', function (event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
};

function spinner(){
  var wrapper = document.getElementById('wrapper')
  wrapper.innerHTML= 
  `
  <div class="header">
  <p>Подтверждение</p>
  </div>
  
  <div class="spinner-container">
  <div class="spinner"></div>
  </div>
  
  <footer>
  <p id="price">${money.toFixed(2)}€</p>
  </footer>
  `
}
function search() {
  var searchInput = document.getElementById('searchInput');
  var rowsContainer = document.querySelector('.rows-container');
  var noResultsRow = rowsContainer.querySelector('.row.no-results');
  var searchQuery = searchInput.value.toLowerCase();
  var foundResults = false;
  
  var rows = rowsContainer.querySelectorAll('.row:not(.no-results)');
  
  rows.forEach(function (row) {
    var nameCell = row.querySelector('.name-cell');
    var nameCellText = nameCell.textContent.toLowerCase();
    var id = row.dataset.id
    
    if (nameCellText.includes(searchQuery) || id.includes(searchQuery)) {
      row.style.display = 'flex';
      foundResults = true
    } else {
      row.style.display = 'none';
    }
  });
  
  noResultsRow.style.display = foundResults ? 'none' : 'flex';
}

