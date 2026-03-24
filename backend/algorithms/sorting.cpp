#include "sorting.h"

#include <algorithm>
#include <chrono>
#include <cctype>
#include <functional>
#include <set>
#include <string>
#include <utility>

namespace sorting {
namespace {

double measureSort(const std::vector<double>& values, const std::function<void(std::vector<double>&)>& sorter) {
    std::vector<double> copy = values;
    const auto start = std::chrono::steady_clock::now();
    sorter(copy);
    const auto end = std::chrono::steady_clock::now();
    const double elapsedMs = std::chrono::duration<double, std::milli>(end - start).count();
    return std::max(0.0, elapsedMs);
}

void bubbleSort(std::vector<double>& values) {
    if (values.empty()) {
        return;
    }

    for (std::size_t i = 0; i + 1 < values.size(); ++i) {
        bool swapped = false;
        for (std::size_t j = 0; j + i + 1 < values.size(); ++j) {
            if (values[j] > values[j + 1]) {
                std::swap(values[j], values[j + 1]);
                swapped = true;
            }
        }
        if (!swapped) {
            break;
        }
    }
}

void selectionSort(std::vector<double>& values) {
    for (std::size_t i = 0; i < values.size(); ++i) {
        std::size_t minIndex = i;
        for (std::size_t j = i + 1; j < values.size(); ++j) {
            if (values[j] < values[minIndex]) {
                minIndex = j;
            }
        }
        if (minIndex != i) {
            std::swap(values[i], values[minIndex]);
        }
    }
}

void insertionSort(std::vector<double>& values) {
    for (std::size_t i = 1; i < values.size(); ++i) {
        const double key = values[i];
        std::size_t j = i;
        while (j > 0 && values[j - 1] > key) {
            values[j] = values[j - 1];
            --j;
        }
        values[j] = key;
    }
}

int partition(std::vector<double>& values, int low, int high) {
    const double pivot = values[high];
    int i = low - 1;
    for (int j = low; j < high; ++j) {
        if (values[j] <= pivot) {
            ++i;
            std::swap(values[i], values[j]);
        }
    }
    std::swap(values[i + 1], values[high]);
    return i + 1;
}

void quickSortImpl(std::vector<double>& values, int low, int high) {
    if (low >= high) {
        return;
    }
    const int pi = partition(values, low, high);
    quickSortImpl(values, low, pi - 1);
    quickSortImpl(values, pi + 1, high);
}

void quickSort(std::vector<double>& values) {
    if (values.empty()) {
        return;
    }
    quickSortImpl(values, 0, static_cast<int>(values.size()) - 1);
}

std::string toLower(const std::string& value) {
    std::string lowered = value;
    for (char& ch : lowered) {
        ch = static_cast<char>(std::tolower(static_cast<unsigned char>(ch)));
    }
    return lowered;
}

std::vector<std::string> normalizeAlgorithms(const std::vector<std::string>& algorithms) {
    static const std::vector<std::string> all = {"bubble", "selection", "insertion", "quick"};
    if (algorithms.empty()) {
        return all;
    }

    std::set<std::string> seen;
    bool includeAll = false;

    for (const auto& algorithm : algorithms) {
        const std::string normalized = toLower(algorithm);
        if (normalized == "all" || normalized == "todos") {
            includeAll = true;
            break;
        }
    }

    if (includeAll) {
        return all;
    }

    std::vector<std::string> selected;
    for (const auto& candidate : all) {
        for (const auto& provided : algorithms) {
            if (toLower(provided) != candidate) {
                continue;
            }
            if (seen.insert(candidate).second) {
                selected.push_back(candidate);
            }
            break;
        }
    }

    return selected.empty() ? all : selected;
}

}  // namespace

double bubbleSortMs(std::vector<double> values) {
    return measureSort(values, bubbleSort);
}

double selectionSortMs(std::vector<double> values) {
    return measureSort(values, selectionSort);
}

double insertionSortMs(std::vector<double> values) {
    return measureSort(values, insertionSort);
}

double quickSortMs(std::vector<double> values) {
    return measureSort(values, quickSort);
}

std::vector<SortTiming> benchmarkSortAlgorithms(
    const std::vector<double>& values,
    const std::vector<std::string>& algorithms
) {
    const auto selected = normalizeAlgorithms(algorithms);
    std::vector<SortTiming> timings;
    timings.reserve(selected.size());

    for (const auto& algorithm : selected) {
        if (values.empty()) {
            timings.push_back({algorithm, 0.0});
            continue;
        }

        if (algorithm == "bubble") {
            timings.push_back({algorithm, bubbleSortMs(values)});
        } else if (algorithm == "selection") {
            timings.push_back({algorithm, selectionSortMs(values)});
        } else if (algorithm == "insertion") {
            timings.push_back({algorithm, insertionSortMs(values)});
        } else if (algorithm == "quick") {
            timings.push_back({algorithm, quickSortMs(values)});
        }
    }

    return timings;
}

}  // namespace sorting
