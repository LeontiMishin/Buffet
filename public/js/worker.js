const socket = io();
let selectedBox = []
  
function updateSelectedDishes(selectedBox, price, size, id) {
  var checkboxes = document.getElementsByClassName('dishCheckbox');
  const isObjectInArray = (arr, targetName) => arr.some(obj => obj.title === targetName);
  for (var i = 0; i < checkboxes.length; i++) {
    var checkbox = checkboxes[i];
    const row = {
      title: checkbox.value, 
      price: price, 
      size: size
    }
    if (checkbox.checked && !isObjectInArray(selectedBox, checkbox.value)) {
      selectedBox.push(row)
      moneyCalculator()
      addingPlusMinus(id, checkbox.value, price, size, price, size)
    }if (!checkbox.checked && isObjectInArray(selectedBox, checkbox.value)) {
      selectedBox.splice(selectedBox.findIndex(obj => obj.title === checkbox.value), 1)
      moneyCalculator()
      addingOriginCell(id, checkbox.value, price, size)
    }
  }

      socket.emit('messageFromWorker', selectedBox, moneyCalculator())
      return selectedBox;
    }

function addingPlusMinus(id, title, price, size, originPrice, originSize){
  var box = document.getElementById(`plusMinus-${id}`);
  box.innerHTML = 
  `
    <div class="button-plus">
    <img src="img/plus.png" onclick="plus(${id}, '${title}', ${price}, '${size}', '${originPrice}', '${originSize}')">
  </div>
  <div class="button-minus">
    <img src="img/minus.png" onclick="minus(${id}, '${title}', ${price}, '${size}', '${originPrice}', '${originSize}')">
  </div>
  `
}

function plus(id, title, price, size, originPrice, originSize){
  var unit = size.replace(/[^a-zA-Z%]/g, '');
  var number = size.replace(/\D/g, '');
  switch(unit){
    case ('tk'):
      number++
      price = parseFloat(price)+parseFloat(originPrice)
      break;
    case ('%'):
      number = parseFloat(number) + 25
      price = parseFloat(originPrice)*number/100
      break;
    case ('ml'):
      number = parseFloat(number) + 250
      price = parseFloat(price)+parseFloat(originPrice)
      break;

  }
  const object = selectedBox.find(obj => obj.title === title)
  object.price = price.toFixed(2)
  object.size = number+unit
  moneyCalculator()
  addingUpdatedCells(id, title, price, number, unit, originPrice, originSize)
  socket.emit('messageFromWorker', selectedBox, moneyCalculator())
}

function minus(id, title, price, size, originPrice, originSize){
  var unit = size.replace(/[^a-zA-Z%]/g, '');
  var number = size.replace(/\D/g, '');
  switch(unit){
    case ('tk'):
      number--
      price = parseFloat(price)-parseFloat(originPrice)
      break;
      case ('%'):
        number = parseFloat(number) - 25
        price = parseFloat(originPrice)*number/100
        break;
        case ('ml'):
          number = parseFloat(number) - 250
          price = parseFloat(price)-parseFloat(originPrice)
          break;  
        }
    if(number===0){
      document.getElementById(`checkbox-${id}`).checked=false
      updateSelectedDishes(selectedBox, originPrice, originSize, id)
    }
    const object = selectedBox.find(obj => obj.title === title)
    object.price = price.toFixed(2)
    object.size = number+unit
    moneyCalculator()
    addingUpdatedCells(id, title, price, number, unit, originPrice, originSize)
    socket.emit('messageFromWorker', selectedBox, moneyCalculator())
}

function addingUpdatedCells(id, title, price, number, unit, originPrice, originSize){
  document.getElementById(`update-${id}`).innerHTML=
  `
  <div class="update-cell">${title}</div>
  <div class="update-cell">${price.toFixed(2)}</div>
  <div class="update-cell">${number+unit}</div>
  <div class="update-cell" id="plusMinus-${id}">
    <div class="button-plus">
      <img src="img/plus.png" onclick="plus(${id}, '${title}', ${price.toFixed(2)}, '${number+unit}', '${originPrice}', '${originSize}')">
    </div>
    <div class="button-minus">
      <img src="img/minus.png" onclick="minus(${id}, '${title}', ${price.toFixed(2)}, '${number+unit}', '${originPrice}', '${originSize}')">
    </div>
  </div>
  `
}

function addingOriginCell(id, title, price, size){
  document.getElementById(`update-${id}`).innerHTML=
 `
  <div class="update-cell">${title}</div>
  <div class="update-cell">${price}</div>
  <div class="update-cell">${size}</div>
  <div class="update-cell" id="plusMinus-${id}"></div>
  `
}

function moneyCalculator(){
  var money = 0 
  selectedBox.forEach(element => {
    money = parseFloat(element.price) + parseFloat(money)
  });

  if(money==0){
    document.getElementById('price').innerHTML = `0.00€`  
  }else{
    document.getElementById('price').innerHTML = `${money.toFixed(2)}€`
  }

  return money;
}

function userRegistration(){
  var data 
  var wrapper = document.getElementById('wrapper')
  wrapper.innerHTML= 
  `
  <div class="header">
      <p>Авторизация</p>
  </div>
  
  <div class="spinner-container">
    <div class="spinner"></div>
  </div>

  <footer>
        <div class="price-button" style="font-size: 26px;" onclick="hospitalRegistered()">
          <p class="price">Записать на больницу</p>
        </div>
    </footer>
  `


  socket.emit('functionFromWorker', data)
}

function hospitalRegistered(){
  location.href = location.href
  socket.emit("reloadFromWorker")
}

socket.on('messageToWorker', (name) => { 
  var wrapper = document.getElementById('wrapper')
  wrapper.innerHTML= 
  `
  <div class="header">
      <p>Подтверждение</p>
  </div>
  
  <div id="myModal" class="modal">
        <div class="modal-content">
          <div class="modal-string" id="string">${name}</div>
          <div class="modal-buttons">
            <div class="modal-button" id="confirm">Подтвердить</div>
            <div class="modal-button" id="deny">Отклонить</div>
          </div>
        </div>
    </div>
  `

  var closeModalBtn = document.getElementById('deny');
  var confirmModalBtn = document.getElementById('confirm');
  var modal = document.getElementById('myModal');
  
  closeModalBtn.addEventListener('click', function () {
    location.href = location.href
    socket.emit("reloadFromWorker")
  });
  
  confirmModalBtn.addEventListener('click', function () {
    hospitalRegistered()
  });
})
