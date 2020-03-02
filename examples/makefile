CC = clang++-8  
CF = -std=c++17 -O3 -Wfatal-errors  -fopenmp -g
INC = -I../src/lib -I../src/lib-graph

BINDIR := bin

#Input/ouptut
build_graph: | $(BINDIR)
	$(CC) $(INC) $(CF) build_graph.cpp -o $(BINDIR)/build_graph

read_graph: | $(BINDIR)
	$(CC) $(INC) $(CF) read_graph.cpp -o $(BINDIR)/read_graph

extract_version: | $(BINDIR)
	$(CC) $(INC) $(CF) extract_version.cpp -o $(BINDIR)/extract_version

createView: | $(BINDIR)
	$(CC) $(INC) $(CF) createView.cpp -o $(BINDIR)/createView

#Queries
query_rwr: | $(BINDIR)
	$(CC) $(INC) $(CF) query_rwr.cpp -o $(BINDIR)/query_rwr
query_traversal: | $(BINDIR)
	$(CC) $(INC) $(CF) query_traversal.cpp -o $(BINDIR)/query_traversal

query_components: | $(BINDIR)
	$(CC) $(INC) $(CF) query_components.cpp -o $(BINDIR)/query_components

query_motifTriangles: | $(BINDIR)
	$(CC) $(INC) $(CF) query_motifTriangles.cpp -o $(BINDIR)/query_motifTriangles
	

merger: | $(BINDIR)
	$(CC) $(INC) $(CF) merger.cpp -o $(BINDIR)/merger

$(BINDIR):
	mkdir $(BINDIR)
