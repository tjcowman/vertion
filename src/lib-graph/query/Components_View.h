#pragma once
#include <string>

#include "Traversal_View.h"
//TODO: refactor into vector of Traversals

/** @class Components
 * Tracks single nodes seperately as an optimization for connected components calculation
 */
template<class GT>
class Components
{
    public:
        Components(const IntegratedViewer<GT>& viewer);

        void compute();

//         Components();
//         Components(VGraph<GT>& graph, int version, bool ignoreSingleNodes=false);

        size_t size(bool includeUnary=true)const;

        const GraphList<VertexI<GT>>& back()const;
        const std::vector<GraphList<VertexI<GT>>>& getComponentList()const;
        const GraphList<VertexI<GT>>& getUnaryComponentList()const;

        void push_back(const GraphList<VertexI<GT>>& vertexList);
        void push_back_unary(const VertexI<GT>& vertex);


        void sort(); //TODO: make functional version currently sorts in descendign size

        void describe();
        double meanSize(bool includeUnary=true)const;
        size_t maxSize()const;

        friend std::ostream& operator<<(std::ostream& os, const Components<GT>& e)
        {
            for(const auto& ee: e.componentList_)
                os<<ee<<"\n";

            os<<e.unaryComponents_;

            return os;
        }

    private:
        //const VGraph<GT>* graph_;
        const IntegratedViewer<GT>* viewer_;

        std::vector<GraphList<VertexI<GT>>> componentList_;
        GraphList<VertexI<GT>> unaryComponents_;

};

template<class GT>
Components<GT>::Components(const IntegratedViewer<GT>& viewer)
{
    viewer_ = &viewer;
}

template<class GT>
void Components<GT>::compute()
{
    std::vector<bool> visitedNodes(viewer_->size().first, false);

    //Perform a traversal such that every node is explored
    for(auto source = visitedNodes.begin(); source != visitedNodes.end();)
    {

        //check to make sure isn't lone node
        typename GT::Index sourceIndex = (typename GT::Index)std::distance(visitedNodes.begin(), source);
        if(viewer_->getDegree(sourceIndex) == 0)
        {
            push_back_unary(VertexI<GT>(sourceIndex, 0));
            visitedNodes[sourceIndex] = true;

            //Move to the next unvisited Index
            while(source != visitedNodes.end() && *source == true)
                ++source;
        }
        else{

            //Add the connected component
            Traversal trav(*viewer_, GraphList<VertexI<GT>>(VertexI<GT>(sourceIndex)));
            trav.traverse();
            push_back(trav.getVertexList());
            componentList_.back().setHeader("Component " + std::to_string(componentList_.size()) + ": Indexes | Hops");


            //Update the  vector of visitedNodes
            for(const auto& e : back().getElements() )
                visitedNodes[e.index_] = true;

            //Move to the next unvisited Index
            while(source != visitedNodes.end() && *source == true)
            {
                ++source;
            }
        }
    }
    unaryComponents_.setHeader("Unary Vertex: Indexes | Hops");

    sort();
}

template<class GT>
size_t Components<GT>::size(bool includeUnary)const
{
    if(includeUnary)
        return componentList_.size() + unaryComponents_.size();
    else
        return componentList_.size();
}

template<class GT>
const GraphList<VertexI<GT>>& Components<GT>::back()const
{
    return componentList_.back();
}

template<class GT>
const std::vector<GraphList<VertexI<GT>>>& Components<GT>::getComponentList()const
{
    return componentList_;
}

template<class GT>
const GraphList<VertexI<GT>>&  Components<GT>::getUnaryComponentList()const
{
    return unaryComponents_;
}

template<class GT>
void Components<GT>::push_back(const GraphList<VertexI<GT>> & vertexList)
{
    componentList_.push_back(vertexList);
}

template<class GT>
void Components<GT>::push_back_unary(const VertexI<GT>& vertex)
{
    unaryComponents_.push_back(vertex);
}

template<class GT>
void Components<GT>::sort()
{
    std::sort(componentList_.begin(),componentList_.end(), [](const auto& e1, const auto& e2){return e1.size() > e2.size();} );
}

template<class GT>
void Components<GT>::describe()
{
    //Index
    //float avgSize =
}

template<class GT>
double Components<GT>::meanSize(bool includeUnary)const
{
    size_t totalNodes = (includeUnary) ?
        unaryComponents_.size() : 0;

    for(const auto& component : componentList_)
        totalNodes += component.size();

    return totalNodes/(double)size(includeUnary);

}

template<class GT>
size_t Components<GT>::maxSize()const
{
    size_t m = 0;
    for(const auto& component : componentList_)
        m = std::max(m,component.size());
    return m;
}
