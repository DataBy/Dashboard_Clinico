#ifndef SORTING_H
#define SORTING_H

#include <string>
#include <vector>

namespace sorting {

struct SortTiming {
    std::string algorithm;
    double elapsedMs;
};

double bubbleSortMs(std::vector<double> values);
double selectionSortMs(std::vector<double> values);
double insertionSortMs(std::vector<double> values);
double quickSortMs(std::vector<double> values);

std::vector<SortTiming> benchmarkSortAlgorithms(const std::vector<double>& values);

}  // namespace sorting

#endif
