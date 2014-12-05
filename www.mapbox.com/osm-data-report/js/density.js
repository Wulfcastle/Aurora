var places = [{
    "name": "Cameroun: YaoundÃ© III, Mfoundi, Centre, 11852",
    "ll": [
      11.4697265625,
      3.8642546157214084
    ],
    "tile": "14/8714/8016"
  },
  {
    "name": "Cameroun: YaoundÃ© V, Mfoundi, Centre, 215",
    "ll": [
      11.513671875,
      3.908098881894123
    ],
    "tile": "14/8716/8014"
  },
  {
    "name": "Cameroun: YaoundÃ© III, Mfoundi, Centre, 11852",
    "ll": [
      11.513671875,
      3.8642546157214084
    ],
    "tile": "14/8716/8016"
  },
  {
    "name": "Cameroun: Mfoundi, Centre",
    "ll": [
      11.4697265625,
      3.908098881894123
    ],
    "tile": "14/8714/8014"
  },
  {
    "name": "Martinique: Fort-de-France",
    "ll": [
      -61.083984375,
      14.647368383896632
    ],
    "tile": "14/5412/7518"
  },
  {
    "name": "France mÃ©tropolitaine: Lafon FÃ©line, Le Bouscat, Bordeaux, Gironde, Aquitaine, 33110",
    "ll": [
      -0.615234375,
      44.87144275016589
    ],
    "tile": "14/8164/5902"
  },
  {
    "name": "Brasil: MesorregiÃ£o Central EspÃ­rito-Santense, EspÃ­rito Santo",
    "ll": [
      -40.341796875,
      -20.26219712424652
    ],
    "tile": "14/6356/9134"
  },
  {
    "name": "France mÃ©tropolitaine: Centre ville, Bordeaux, Gironde, Aquitaine, 33000",
    "ll": [
      -0.615234375,
      44.84029065139799
    ],
    "tile": "14/8164/5904"
  },
  {
    "name": "Cameroun: LekiÃ©, Centre",
    "ll": [
      11.513671875,
      3.9519408561575946
    ],
    "tile": "14/8716/8012"
  },
  {
    "name": "France mÃ©tropolitaine: Madeleine, 8e Arrondissement, Paris, ÃŽle-de-France, 75008",
    "ll": [
      2.28515625,
      48.8936153614802
    ],
    "tile": "14/8296/5634"
  }
];

var divs = d3.select('.density')
    .append('div')
    .selectAll('a.img')
    .data(places)
    .enter()
    .append('a')
    .attr('class', 'img')
    .attr('target', '_blank')
    .attr('href', function(d) {
        return 'http://openstreetmap.org/?lat=' + d.ll[1] + '&lon=' + d.ll[0] + '&zoom=14';
    });

divs.append('img')
    .attr('src', function(d) {
        return 'http://a.tile.openstreetmap.org/' + d.tile + '.png';
    })
    .attr('title', function(d) {
        return d.name;
    });


