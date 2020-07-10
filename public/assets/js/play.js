// todo display a progress bar of unhealthy intervals
let unhealthyIntervals = 0;
let dead;

// INITIAL PAGE LOAD
$(async () => {
  // todo add some validation here, if there's no/null values from getClientCreds
  // don't bother with the db call
  const obj = getClientCreds();
  const animal = await getAnimal(obj);
  localStorage.setItem('animal-uuid', JSON.stringify(animal.msg[0].uuid)); // to call it elsewhere

  if (!animal.msg[0].dead) {
    startGame();
  } else {
    dead = true;
  }
  populateAnimalStats(animal.msg[0]);
});

function getClientCreds() {
  const obj = {
    token: JSON.parse(localStorage.getItem('accessToken')),
    uuid: JSON.parse(localStorage.getItem('uuid')),
    username: JSON.parse(localStorage.getItem('username')),
  };

  return obj;
}

async function getAnimal(creds) {
  const url = window.location.href.split('/');
  const animal = url[url.length - 1]; // todo not sure if there's a better way to go about this

  return $.ajax({
    url: `/api/users/${creds.username}/${animal}`,
    type: 'post',
    headers: {
      authorization: creds.token,
    },
    dataType: 'json',
  })
    .then(async (result) => result)
    .fail((result) => {
      // todo add a toast here
      console.log(result);
    });
}

async function updateStats(data, creds) {
  return $.ajax({
    url: '/api/animals/clock',
    type: 'put',
    data,
    headers: {
      authorization: creds.token,
    },
    dataType: 'json',
  })
    .then(async (result) => result)
    .fail((result) => {
      // todo add a toast here
      console.log(result);
    });
}

async function updateStat(data, creds) {
  return $.ajax({
    url: '/api/animals/update',
    type: 'put',
    data,
    headers: {
      authorization: creds.token,
    },
    dataType: 'json',
  })
    .then(async (result) => result)
    .fail((result) => {
      // todo add a toast here
      console.log(result);
    });
}

function populateAnimalStats(animal) {
  // const { fatigue, hungry, sick, bathroom, bored, boredom, health, unhealthy} = animal;
  const type = animal.species;
  // todo some math for calculating state
  // todo might grab global dead var
  const state = dead ? 'rip' : calculateStatus(animal);
  const stats = Object.entries(animal).map(([key, val]) => `<li>${key}: ${val}</li>`).join('');
  const display = `<div class="waves-effect" id="animalBox">
      <div class="valign-wrapper">
          <img 
          src="/assets/concept-art/${type}-tamagotchi/img/${type}_${state}.png"
          style="max-width:80px; height: 80px;border-radius:50%;"
          / >
          <div class="title">
            <ul>
              ${stats}
            </ul>
          </div>
          <i class="material-icons ml-auto"><i class="${'fas fa-poop'}"></i></i>
      </div>
    </div>`;
  $('#animalBox').remove();
  $('#animal').append(display);
}

async function refreshScreen(action) {
  const obj = getClientCreds();
  const uuid = JSON.parse(localStorage.getItem('animal-uuid'));

  if (action) {
    await updateStat({ uuid, action }, getClientCreds());
  } else {
    await updateStats({ uuid }, getClientCreds());
    $('.updateStat').attr('disabled', false);
  }

  const animal = await getAnimal(obj);
  populateAnimalStats(animal.msg[0]);

  if (!dead) {
    if (animal.msg[0].unhealthy === true && !action) {
      // todo reset unhealthy if animals is brought back to health
      unhealthyIntervals += 1;
      $('#negative')[0].play();
    } else {
      $('#positive')[0].play();
    }
  } else {
    console.log('tis dead still')
    // play dead song
    // $('#rip')[0].play();
  }
}

function isDead() {
  console.log('Unhealthy for ', unhealthyIntervals, ' intervals.');
  // if animal has been unhealthy for 5 intervals ~ 50 seconds (use milliseconds instead)
  if (unhealthyIntervals > 5) {
    dead = true;
    return true;
  }
  return false;
}

function startGame() {
  let sec = 0;
  const timerInterval = setInterval(() => {
    sec += 1;
    if (isDead()) {
      clearInterval(timerInterval);
      refreshScreen('dead');
    }
    if (sec % 10 === 0) {
      refreshScreen();
    }
  }, 1000);
}

function calculateStatus(animal) {
  const { fatigue, sick, bored } = animal;
  // todo this feels like an oppurtunity for recursion
  // if a > b > c
  // if b > c > a
  // if c > a > b
  // if a > c > b
  // if b > a > c
  // if c > b > a
  // console.log(fatigue)
}

// USER INPUT
$('.updateStat').click(async function () {
  if (!dead) {
    $(this).attr('disabled', true);
    let action;
    switch (this.id) {
      case 'feed':
        action = 'hunger';
        break;
      case 'sleep':
        action = 'fatigue';
        break;
      case 'clean':
        action = 'bathroom';
        break;
      case 'medicine':
        action = 'sick';
        break;
      case 'play':
        action = 'boredom';
        break;
      case 'love':
        action = 'bored';
        break;
      default:
        action = 'hunger';
    }
    unhealthyIntervals -= 1;
    refreshScreen(action);
  }
});
