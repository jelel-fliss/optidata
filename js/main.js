$(document).ready(function() {
  var width = 560;
  var height = 500;
  var color = d3.scaleOrdinal(d3.schemeCategory10);

  Legend_List = [
    { poste: "Responsable", color: "#1f77b4" },
    { poste: "Consultant", color: "#ff7f0e" },
    { poste: "Projet Interne", color: "#d62728" },
    { poste: "Projet Externe", color: "#2ca02c" }
  ];

  d3.json("js/data/graphFile.json").then(function(graph) {


    var tip = d3
      .tip()
      .attr("class", "d3-tip")
      .html(function(d) {
        var output =
          "<strong>"+d.id+"</strong>";
        
        return output;
      });


    var label = {
      nodes: [],
      links: []
    };

    graph.nodes.forEach(function(d, i) {
      label.nodes.push({ node: d });
      label.nodes.push({ node: d });
      label.links.push({
        source: i * 2,
        target: i * 2 + 1
      });
    });

    var labelLayout = d3
      .forceSimulation(label.nodes)
      .force("charge", d3.forceManyBody().strength(-50))
      .force(
        "link",
        d3
          .forceLink(label.links)
          .distance(0)
          .strength(2)
      );

    var graphLayout = d3
      .forceSimulation(graph.nodes)
      .force("charge", d3.forceManyBody().strength(-1000))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(1))
      .force("y", d3.forceY(height / 2).strength(1))
      .force(
        "link",
        d3
          .forceLink(graph.links)
          .id(function(d) {
            return d.id;
          })
          .distance(50)
          .strength(1)
      )
      .on("tick", ticked);

    var adjlist = [];

    graph.links.forEach(function(d) {
      adjlist[d.source.index + "-" + d.target.index] = false;
      adjlist[d.target.index + "-" + d.source.index] = false;
    });

    var svg = d3
      .select("svg")
      .call(tip)
      .attr("width", width)
      .attr("height", height);

    var container = svg.append("g");

    var legend = container
      .append("g")
      .attr("class", "legend")

      .attr("transform", "translate(20,0)");

    function Legend_Writing(List) {
      List.forEach(function(element, i) {
        if (i < 2) {
          var legendrow = legend
            .append("g")
            .attr("class", "Legend_Elements")

            .attr("transform", "translate(" + i * 150 + ",490)");
          legendrow
            .append("circle")
            .attr("r", 4)
            .attr("fill", element.color);

          legendrow
            .append("text")
            .attr("class", "Legend_Elements")
            .attr("x", 25)
            .attr("y", 5)
            .attr("text-anchor", "start")
            .style("text-transform", "capitalize")
            .text(element.poste);
        } else {
          var legendrow = legend
            .append("g")
            .attr("class", "Legend_Elements")

            .attr("transform", "translate(" + (i - 2) * 150 + ",510)");
          legendrow
            .append("circle")
            .attr("r", 4)
            .attr("fill", element.color);

          legendrow
            .append("text")
            .attr("class", "Legend_Elements")
            .attr("x", 25)
            .attr("y", 5)
            .attr("text-anchor", "start")
            .style("text-transform", "capitalize")
            .text(element.poste);
        }
      });
    }

    Legend_Writing(Legend_List);

    var link = container
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(graph.links)
      .enter()
      .append("line")
      .attr("stroke", function(d) {
        /*if (d.target.id){
              console.log(d.target.id)
          }*/
        return "#aaa";
      })
      .attr("id", function(d, i) {
        return d.source.id + "_to_" + d.target.id;
      })
      .attr("class", function(d) {
        return "project_relation";
      })
      .attr("stroke-width", "2px");

    var node = container
      .append("g")

      .attr("class", "nodes")
      .selectAll("g")
      .data(graph.nodes)
      .enter()
      .append("circle")
      .attr("r", function(d) {
        return 5;
      })
      .attr("fill", function(d) {
        return color(d.group);
      })
      .on("click", function(d) {
        detect_projet(d);
        d3.select(this).attr("r", 10);

        return info_update(d);
      })

      .on("mouseover", function(d) {
        d3.select(this).attr("r", 7);
        tip.show(d);
        
      })
      .on("mouseout", function(d) {
        d3.select(this).attr("r", 5);
        tip.hide(d);
      })
      .attr("stroke", "#fff");

    node.call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );

    var labelNode = container
      .append("g")
      .attr("class", "labelNodes")
      .selectAll("text")
      .data(label.nodes)
      .enter()
      .append("text")
      .text(function(d, i) {
        return null;
      })
      .style("fill", "#555")

      .style("pointer-events", "none"); // to prevent mouseover/drag capture

    function ticked() {
      node.call(updateNode);
      link.call(updateLink);

      labelLayout.alphaTarget(0.3).restart();
      labelNode.each(function(d, i) {
        if (i % 2 == 0) {
          d.x = d.node.x;
          d.y = d.node.y;
        } else {
          var b = this.getBBox();

          var diffX = d.x - d.node.x;
          var diffY = d.y - d.node.y;

          var dist = Math.sqrt(diffX * diffX + diffY * diffY);

          var shiftX = (b.width * (diffX - dist)) / (dist * 2);
          shiftX = Math.max(-b.width, Math.min(0, shiftX));
          var shiftY = 16;
          this.setAttribute(
            "transform",
            "translate(" + shiftX + "," + shiftY + ")"
          );
        }
      });
      labelNode.call(updateNode);
    }

    function fixna(x) {
      if (isFinite(x)) return x;
      return 0;
    }

    function updateLink(link) {
      link
        .attr("x1", function(d) {
          return fixna(d.source.x);
        })
        .attr("y1", function(d) {
          return fixna(d.source.y);
        })
        .attr("x2", function(d) {
          return fixna(d.target.x);
        })
        .attr("y2", function(d) {
          return fixna(d.target.y);
        });
    }

    function updateNode(node) {
      node.attr("transform", function(d) {
        return "translate(" + fixna(d.x) + "," + fixna(d.y) + ")";
      });
    }

    function dragstarted(d) {
      d3.event.sourceEvent.stopPropagation();
      if (!d3.event.active) graphLayout.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) graphLayout.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    function detect_projet(data) {
      if ((data.group == 3) | (data.group == 4)) {
        coloring_link_project(data.id);
      }
    }
  }); // d3.json
});

function button_translation(project) {
  //$(project_btn).css("left",14); Works !

  //console.log("Button Translation Function Called ! Button should translate !");
  //var button = document.getElementById("Fatma Tours_btn");
  //var button = $('#Fatma Tours_btn')[0];
  //console.log(button);

  //button.style.transform.translateX(14);

  //button.style.transform(14, 0);
  var all_btns;
  all_btns = $(".btn");
  $.each(all_btns, function(i, x) {
    // x = btn
    if (x.getAttribute("id").includes(project)) {
      x.style.transform = "translate(14px,0)";
      if (x.getAttribute("class").includes("extern")) {
        // Intern Project => Green Button
        x.style.backgroundColor = "rgb(57, 207, 90)";
        x.style.borderColor = "rgb(0, 255, 42)";
      } else {
        x.style.backgroundColor = "rgb(247, 44, 44)";
        x.style.borderColor = "rgb(236, 57, 51)";
      }
    } else {
      x.style.backgroundColor = "rgb(255, 167, 85)";
      x.style.borderColor = "rgb(255, 173, 66)";
      x.style.transform = "translate(0,0)";
      //
    }
  });
  //$(".Fatma Tours_btn").css("left",14);
}

function coloring_link_project(project) {
  var all_lines = $("line");

  $.each(all_lines, function(i, x) {
    if (x.id.includes(project)) {
      x.style.stroke = "orange";
    } else {
      x.style.stroke = "#aaa";
    }
  });
  $(".avatar").attr("src", "./assets/avatars/" + project + ".png");
  $(".Profile").text(project);

  button_translation(project + "_btn");
  //console.log($(".Fatma_Tours_btn"));
}

function info_update(data) {
  $(".avatar").attr("src", "./assets/avatars/" + data.id + ".png");
  $(".Profile").text(data.id);
 
}
