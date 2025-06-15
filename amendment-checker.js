// 전역 변수
var originalLines = [];
var modifiedLines = [];
var editHistory = [];
var historyIndex = -1;
var currentSearchIndex = -1;
var searchMatches = [];
var isEditing = false;

// DOM 요소 참조
var inputSection, inputContent, collapseBtn, originalText, fileInput, fileBtn, fileStatus;
var generateBtn, searchInput, replaceInput, findBtn, replaceAllBtn, undoBtn, redoBtn;
var downloadBtn, toolbarMessage, tableContainer, emptyState;

// 초기화 - 중복 이벤트 리스너 방지
document.addEventListener('DOMContentLoaded', function() {
    // 기존 이벤트 리스너가 있다면 제거
    if (window.amendmentCheckerInitialized) {
        console.log('이미 초기화됨 - 중복 방지');
        return;
    }
    window.amendmentCheckerInitialized = true;
    
    console.log('DOM 로드 완료 - amendment-checker.js 초기화 시작');
    
    // DOM 요소 가져오기
    inputSection = document.getElementById('inputSection');
    inputContent = document.getElementById('inputContent');
    collapseBtn = document.getElementById('collapseBtn');
    originalText = document.getElementById('originalText');
    fileInput = document.getElementById('fileInput');
    fileBtn = document.getElementById('fileBtn');
    fileStatus = document.getElementById('fileStatus');
    generateBtn = document.getElementById('generateBtn');
    searchInput = document.getElementById('searchInput');
    replaceInput = document.getElementById('replaceInput');
    findBtn = document.getElementById('findBtn');
    replaceAllBtn = document.getElementById('replaceAllBtn');
    undoBtn = document.getElementById('undoBtn');
    redoBtn = document.getElementById('redoBtn');
    downloadBtn = document.getElementById('downloadBtn');
    toolbarMessage = document.getElementById('toolbarMessage');
    tableContainer = document.getElementById('tableContainer');
    emptyState = document.getElementById('emptyState');

    // 필수 요소만 확인 - 수정된 부분
    var requiredElements = ['originalText', 'generateBtn'];
    var missingElements = [];

    requiredElements.forEach(function(id) {
        var element = document.getElementById(id);
        if (!element) {
            missingElements.push(id);
        }
    });

    if (missingElements.length > 0) {
        console.error('필수 DOM 요소를 찾을 수 없습니다:', missingElements);
        return; // 필수 요소가 없으면 초기화 중단
    }

    // 선택적 요소들은 조건부로 확인
    if (!fileBtn || !fileInput) {
        console.warn('파일 업로드 요소를 찾을 수 없습니다 - 파일 업로드 기능 비활성화');
        // 파일 업로드 기능만 비활성화하고 계속 진행
    }

    setupEventListeners();
    updateToolbarButtons();
    
    console.log('amendment-checker.js 초기화 완료');
});

function setupEventListeners() {
    console.log('이벤트 리스너 설정 시작');
    
    // 파일 업로드 관련 - 요소가 있을 때만 처리
    if (fileBtn && fileInput) {
        // 모든 기존 이벤트 리스너 완전 제거
        var newFileBtn = fileBtn.cloneNode(true);
        fileBtn.parentNode.replaceChild(newFileBtn, fileBtn);
        fileBtn = newFileBtn;
        
        var newFileInput = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newFileInput, fileInput);
        fileInput = newFileInput;
        
        // 파일 업로드 버튼 이벤트 - 직접적인 방법
        fileBtn.onclick = function(e) {
            console.log('파일 버튼 onclick 이벤트');
            e.preventDefault();
            e.stopPropagation();
            
            try {
                console.log('fileInput.click() 호출 시도');
                fileInput.value = ''; // 초기화
                fileInput.click();
                console.log('fileInput.click() 호출 완료');
            } catch (error) {
                console.error('fileInput.click() 오류:', error);
            }
            
            return false;
        };
        
        // 파일 선택 이벤트 - 모든 이벤트 타입 등록
        fileInput.onchange = function(e) {
            console.log('onchange - files:', e.target.files.length);
            handleFileSelection(e);
        };
        
        fileInput.oninput = function(e) {
            console.log('oninput - files:', e.target.files.length);
            handleFileSelection(e);
        };
        
        // 직접 이벤트 리스너도 추가
        fileInput.addEventListener('change', function(e) {
            console.log('addEventListener change - files:', e.target.files.length);
            handleFileSelection(e);
        }, true);
    } else {
        console.log('파일 업로드 요소 없음 - 스킵');
    }
    
    // 나머지 이벤트 리스너들 - 요소 존재 확인 후 등록
    if (collapseBtn) collapseBtn.addEventListener('click', toggleInputSection);
    if (generateBtn) generateBtn.addEventListener('click', generateComparisonTable);
    if (findBtn) findBtn.addEventListener('click', findText);
    if (replaceAllBtn) replaceAllBtn.addEventListener('click', replaceAllText);
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') findText();
        });
    }
    if (undoBtn) undoBtn.addEventListener('click', undo);
    if (redoBtn) redoBtn.addEventListener('click', redo);
    if (downloadBtn) downloadBtn.addEventListener('click', downloadModifiedText);
    
    // 청구항 점검 버튼 - 조건부 등록
    var claimCheckBtn = document.getElementById('claimCheckBtn');
    if (claimCheckBtn) {
        console.log('청구항 점검 버튼 발견 - 이벤트 연결');
        claimCheckBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openClaimChecker();
        });
    } else {
        console.log('청구항 점검 버튼 없음 - 스킵');
    }
    
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    console.log('이벤트 리스너 설정 완료');
}

// 파일 선택 처리 함수 - 중복 호출 방지
var fileSelectionInProgress = false;

function handleFileSelection(e) {
    if (fileSelectionInProgress) {
        console.log('파일 선택 처리 중 - 중복 호출 방지');
        return;
    }
    
    var files = e.target.files;
    console.log('handleFileSelection - files:', files ? files.length : 'null');
    
    if (files && files.length > 0) {
        var file = files[0];
        console.log('파일 선택됨:', file.name, 'size:', file.size);
        
        fileSelectionInProgress = true;
        handleFileUpload(e);
        
        // 3초 후 플래그 리셋
        setTimeout(function() {
            fileSelectionInProgress = false;
        }, 3000);
    } else {
        console.log('파일이 선택되지 않음');
    }
}

// 입력 섹션 접기/펼치기
function toggleInputSection() {
    if (inputContent.classList.contains('collapsed')) {
        inputContent.classList.remove('collapsed');
        inputSection.classList.remove('collapsed');
        collapseBtn.textContent = '접기';
    } else {
        inputContent.classList.add('collapsed');
        inputSection.classList.add('collapsed');
        collapseBtn.textContent = '펼치기';
    }
}

// 파일 업로드 처리 - 수정된 부분
function handleFileUpload(event) {
    console.log('handleFileUpload 호출됨');
    var file = event.target.files[0];
    if (!file) {
        console.log('파일이 선택되지 않음');
        return;
    }

    console.log('선택된 파일:', file.name, file.type);
    var fileExtension = file.name.split('.').pop().toLowerCase();
    
    // 상태 업데이트
    toolbarMessage.textContent = '파일 읽는 중...';

    if (fileExtension === 'docx') {
        console.log('DOCX 파일 처리 시작');
        handleDocxFile(file);
    } else if (fileExtension === 'txt') {
        console.log('TXT 파일 처리 시작');
        handleTextFile(file);
    } else {
        showFileError('지원하지 않는 파일 형식입니다. docx 또는 txt 형식을 사용해주세요.');
    }
}

// DOCX 파일 처리 - 수정된 부분
function handleDocxFile(file) {
    console.log('DOCX 파일 읽기 시작');
    var reader = new FileReader();
    reader.onload = function(e) {
        console.log('FileReader onload 이벤트');
        var arrayBuffer = e.target.result;
        
        if (typeof mammoth !== 'undefined') {
            console.log('mammoth 라이브러리 사용 가능');
            mammoth.extractRawText({arrayBuffer: arrayBuffer})
                .then(function(result) {
                    console.log('mammoth 텍스트 추출 성공');
                    var text = result.value;
                    text = cleanExtractedText(text);
                    console.log('추출된 텍스트 길이:', text.length);
                    originalText.value = text;
                    showFileSuccess(file.name);
                })
                .catch(function(err) {
                    console.error('DOCX 파싱 오류:', err);
                    showFileError('DOCX 파일을 읽는 중 오류가 발생했습니다: ' + err.message);
                });
        } else {
            console.error('mammoth 라이브러리 없음');
            showFileError('DOCX 파일 처리 라이브러리가 로드되지 않았습니다.');
        }
    };
    reader.onerror = function() {
        console.error('FileReader 오류');
        showFileError('파일을 읽는 중 오류가 발생했습니다.');
    };
    reader.readAsArrayBuffer(file);
}

// TXT 파일 처리 - 수정된 부분
function handleTextFile(file) {
    console.log('TXT 파일 읽기 시작');
    var reader = new FileReader();
    reader.onload = function(e) {
        console.log('TXT 파일 읽기 완료');
        var text = e.target.result;
        console.log('읽은 텍스트 길이:', text.length);
        originalText.value = text;
        showFileSuccess(file.name);
    };
    reader.onerror = function() {
        console.error('TXT 파일 읽기 오류');
        showFileError('텍스트 파일을 읽는 중 오류가 발생했습니다.');
    };
    reader.readAsText(file, 'UTF-8');
}

// 추출된 텍스트 정리
function cleanExtractedText(text) {
    if (!text) return '';
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.trim();
    return text;
}

// 파일 로드 성공 표시 - 수정된 부분
function showFileSuccess(fileName) {
    console.log('파일 로드 성공:', fileName);
    toolbarMessage.textContent = fileName + ' 파일이 성공적으로 로드되었습니다.';
}

// 파일 로드 오류 표시 - 수정된 부분  
function showFileError(message) {
    console.log('파일 로드 오류:', message);
    toolbarMessage.textContent = '파일 로드 실패: ' + message;
}

// 비교 테이블 생성
function generateComparisonTable() {
    var text = originalText.value.trim();
    if (!text) {
        toolbarMessage.textContent = '최초 명세서를 입력해주세요.';
        return;
    }

    originalLines = text.split('\n');
    modifiedLines = originalLines.slice();
    
    saveToHistory();
    createTable();
    toggleInputSection();
    
    toolbarMessage.textContent = originalLines.length + '개 라인의 비교 테이블이 생성되었습니다.';
}

// 테이블 생성
function createTable() {
    emptyState.style.display = 'none';
    
    var table = document.createElement('table');
    table.className = 'comparison-table';
    
    var thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>문단</th><th>최초</th><th>수정본</th></tr>';
    table.appendChild(thead);
    
    var tbody = document.createElement('tbody');
    
    for (var i = 0; i < Math.max(originalLines.length, modifiedLines.length); i++) {
        var row = document.createElement('tr');
        
        var paragraphCell = document.createElement('td');
        paragraphCell.className = 'paragraph-num';
        paragraphCell.textContent = String(i + 1).padStart(4, '0');
        paragraphCell.setAttribute('data-line', i);
        
        var originalCell = document.createElement('td');
        originalCell.className = 'text-cell original';
        originalCell.setAttribute('data-line', i);
        originalCell.textContent = originalLines[i] || '';
        
        var modifiedCell = document.createElement('td');
        modifiedCell.className = 'text-cell modified';
        modifiedCell.setAttribute('data-line', i);
        modifiedCell.textContent = modifiedLines[i] || '';
        modifiedCell.setAttribute('data-line-index', i);
        
        row.appendChild(paragraphCell);
        row.appendChild(originalCell);
        row.appendChild(modifiedCell);
        tbody.appendChild(row);
    }
    
    table.appendChild(tbody);
    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);
    
    addTableEventListeners();
    updateDifferences();
}

// 테이블 이벤트 리스너 추가
function addTableEventListeners() {
    var paragraphCells = document.querySelectorAll('.paragraph-num');
    for (var i = 0; i < paragraphCells.length; i++) {
        paragraphCells[i].addEventListener('click', function() {
            var lineIndex = parseInt(this.getAttribute('data-line'));
            scrollToRow(lineIndex);
        });
    }
    
    var modifiedCells = document.querySelectorAll('.text-cell.modified');
    for (var i = 0; i < modifiedCells.length; i++) {
        modifiedCells[i].addEventListener('dblclick', function() {
            var lineIndex = parseInt(this.getAttribute('data-line-index'));
            startEditing(lineIndex);
        });
    }
}

// 인라인 편집 시작
function startEditing(lineIndex) {
    if (isEditing) return;
    
    isEditing = true;
    var cell = document.querySelector('td.modified[data-line-index="' + lineIndex + '"]');
    var currentText = modifiedLines[lineIndex] || '';
    
    cell.classList.add('editing');
    
    var textarea = document.createElement('textarea');
    textarea.className = 'inline-editor';
    textarea.value = currentText;
    
    var buttonDiv = document.createElement('div');
    buttonDiv.className = 'edit-buttons';
    
    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'edit-btn cancel';
    cancelBtn.textContent = '취소';
    cancelBtn.addEventListener('click', function() {
        cancelEditing(lineIndex);
    });
    
    var saveBtn = document.createElement('button');
    saveBtn.className = 'edit-btn';
    saveBtn.textContent = '저장';
    saveBtn.addEventListener('click', function() {
        saveEditing(lineIndex, textarea.value);
    });
    
    buttonDiv.appendChild(cancelBtn);
    buttonDiv.appendChild(saveBtn);
    
    cell.innerHTML = '';
    cell.appendChild(textarea);
    cell.appendChild(buttonDiv);
    
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    
    textarea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveEditing(lineIndex, textarea.value);
        } else if (e.key === 'Escape') {
            cancelEditing(lineIndex);
        }
    });
}

// 편집 저장
function saveEditing(lineIndex, newText) {
    saveToHistory();
    modifiedLines[lineIndex] = newText;
    finishEditing(lineIndex, newText);
    toolbarMessage.textContent = '라인 ' + (lineIndex + 1) + '이 수정되었습니다.';
}

// 편집 취소
function cancelEditing(lineIndex) {
    var currentText = modifiedLines[lineIndex] || '';
    finishEditing(lineIndex, currentText);
}

// 편집 완료
function finishEditing(lineIndex, text) {
    isEditing = false;
    var cell = document.querySelector('td.modified[data-line-index="' + lineIndex + '"]');
    cell.classList.remove('editing');
    cell.textContent = text;
    cell.classList.add('highlight-change');
    
    setTimeout(function() {
        cell.classList.remove('highlight-change');
    }, 1000);
    
    updateDifferences();
}

// 텍스트 찾기
function findText() {
    var searchTerm = searchInput.value.trim();
    if (!searchTerm) {
        toolbarMessage.textContent = '찾을 텍스트를 입력해주세요.';
        return;
    }

    clearSearchHighlights();
    searchMatches = [];
    
    for (var i = 0; i < modifiedLines.length; i++) {
        if (modifiedLines[i] && modifiedLines[i].indexOf(searchTerm) !== -1) {
            searchMatches.push(i);
        }
    }

    if (searchMatches.length === 0) {
        toolbarMessage.textContent = '검색 결과가 없습니다.';
        return;
    }

    currentSearchIndex = 0;
    highlightSearchResults(searchTerm);
    scrollToSearchResult();
    
    toolbarMessage.textContent = '총 ' + searchMatches.length + '개 발견, ' + (currentSearchIndex + 1) + '번째 표시중';
}

// 검색 결과 하이라이트
function highlightSearchResults(searchTerm) {
    for (var i = 0; i < searchMatches.length; i++) {
        var lineIndex = searchMatches[i];
        var cell = document.querySelector('td.modified[data-line-index="' + lineIndex + '"]');
        if (cell && !cell.classList.contains('editing')) {
            var text = modifiedLines[lineIndex];
            var regex = new RegExp(escapeRegExp(searchTerm), 'gi');
            var highlightedText = text.replace(regex, '<span class="highlight-search">$&</span>');
            cell.innerHTML = highlightedText;
        }
    }
}

// 검색 결과로 스크롤
function scrollToSearchResult() {
    if (currentSearchIndex >= 0 && currentSearchIndex < searchMatches.length) {
        var lineIndex = searchMatches[currentSearchIndex];
        var cell = document.querySelector('td.modified[data-line-index="' + lineIndex + '"]');
        if (cell) {
            cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

// 검색 하이라이트 제거
function clearSearchHighlights() {
    var highlights = document.querySelectorAll('.highlight-search');
    for (var i = 0; i < highlights.length; i++) {
        var el = highlights[i];
        var parent = el.parentNode;
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
    }
    updateDifferences();
}

// 일괄 변경
function replaceAllText() {
    var searchTerm = searchInput.value.trim();
    var replaceTerm = replaceInput.value;
    
    if (!searchTerm) {
        toolbarMessage.textContent = '찾을 텍스트를 입력해주세요.';
        return;
    }

    saveToHistory();

    var replaceCount = 0;
    for (var i = 0; i < modifiedLines.length; i++) {
        var line = modifiedLines[i];
        if (line && line.indexOf(searchTerm) !== -1) {
            var regex = new RegExp(escapeRegExp(searchTerm), 'g');
            var newLine = line.replace(regex, replaceTerm);
            if (newLine !== line) {
                replaceCount++;
                modifiedLines[i] = newLine;
            }
        }
    }

    createTable();
    toolbarMessage.textContent = '총 ' + replaceCount + '개의 항목이 변경되었습니다.';
}

// 실행취소
function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        modifiedLines = editHistory[historyIndex].slice();
        createTable();
        updateToolbarButtons();
        toolbarMessage.textContent = '실행취소되었습니다.';
    }
}

// 다시실행
function redo() {
    if (historyIndex < editHistory.length - 1) {
        historyIndex++;
        modifiedLines = editHistory[historyIndex].slice();
        createTable();
        updateToolbarButtons();
        toolbarMessage.textContent = '다시실행되었습니다.';
    }
}

// 히스토리 저장
function saveToHistory() {
    editHistory = editHistory.slice(0, historyIndex + 1);
    editHistory.push(modifiedLines.slice());
    historyIndex = editHistory.length - 1;
    
    if (editHistory.length > 50) {
        editHistory = editHistory.slice(-50);
        historyIndex = editHistory.length - 1;
    }
    
    updateToolbarButtons();
}

// 툴바 버튼 상태 업데이트
function updateToolbarButtons() {
    undoBtn.disabled = historyIndex <= 0;
    redoBtn.disabled = historyIndex >= editHistory.length - 1;
}

// 다운로드
function downloadModifiedText() {
    if (modifiedLines.length === 0) {
        toolbarMessage.textContent = '다운로드할 내용이 없습니다.';
        return;
    }

    try {
        var text = modifiedLines.join('\n');
        
        var now = new Date();
        var year = now.getFullYear();
        var month = String(now.getMonth() + 1).padStart(2, '0');
        var day = String(now.getDate()).padStart(2, '0');
        var hours = String(now.getHours()).padStart(2, '0');
        var minutes = String(now.getMinutes()).padStart(2, '0');
        
        var dateTimeString = year + month + day + '_' + hours + minutes;
        var fileName = '수정본_명세서_' + dateTimeString + '.txt';
        
        var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        var textData = new TextEncoder().encode(text);
        var blob = new Blob([bom, textData], { 
            type: 'text/plain;charset=utf-8' 
        });
        
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        
        setTimeout(function() {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        toolbarMessage.textContent = fileName + ' 파일이 다운로드되었습니다.';
        
    } catch (error) {
        console.error('다운로드 오류:', error);
        toolbarMessage.textContent = '다운로드 실패. 브라우저가 다운로드를 지원하지 않습니다.';
    }
}

// 차이점 업데이트 - 개선된 로직
function updateDifferences() {
    for (var i = 0; i < Math.max(originalLines.length, modifiedLines.length); i++) {
        var originalCell = document.querySelector('td.original[data-line="' + i + '"]');
        var modifiedCell = document.querySelector('td.modified[data-line-index="' + i + '"]');
        
        if (originalCell && modifiedCell) {
            var original = originalLines[i] || '';
            var modified = modifiedLines[i] || '';
            
            // 기존 하이라이트 클래스 제거
            originalCell.classList.remove('text-difference', 'text-addition');
            modifiedCell.classList.remove('text-difference', 'text-addition');
            
            if (original !== modified) {
                if (original && !modified) {
                    // 원본에만 있는 경우 (삭제)
                    originalCell.classList.add('text-difference');
                    originalCell.textContent = original;
                    modifiedCell.textContent = '';
                } else if (!original && modified) {
                    // 수정본에만 있는 경우 (추가)
                    modifiedCell.classList.add('text-addition');
                    originalCell.textContent = '';
                    modifiedCell.textContent = modified;
                } else {
                    // 둘 다 있지만 다른 경우 - 정밀한 단어 비교
                    var diff = compareWords(original, modified);
                    originalCell.innerHTML = diff.originalHtml;
                    modifiedCell.innerHTML = diff.modifiedHtml;
                }
            } else {
                // 동일한 경우
                originalCell.textContent = original;
                modifiedCell.textContent = modified;
            }
        }
    }
}

// // 간단하고 정확한 단어 비교 함수 - 집합 기반 접근
// function compareWords(original, modified) {
//     var origTokens = tokenizeKorean(original);
//     var modTokens = tokenizeKorean(modified);
    
//     // 두 문장이 완전히 동일한 경우
//     if (original === modified) {
//         return {
//             originalHtml: escapeHtml(original),
//             modifiedHtml: escapeHtml(modified)
//         };
//     }
    
//     // 각 토큰에 고유 ID 부여하여 매칭
//     var origResult = markTokenDifferences(origTokens, modTokens);
//     var modResult = markTokenDifferences(modTokens, origTokens);
    
//     return {
//         originalHtml: origResult,
//         modifiedHtml: modResult
//     };
// }

// // 토큰 차이점 표시 함수
// function markTokenDifferences(sourceTokens, targetTokens) {
//     var result = '';
//     var targetSet = createTokenSet(targetTokens);
    
//     for (var i = 0; i < sourceTokens.length; i++) {
//         var token = sourceTokens[i];
//         var isCommon = isTokenInSet(token, targetSet);
        
//         if (isCommon) {
//             // 공통 토큰 - 하이라이트 안함
//             result += escapeHtml(token);
//         } else {
//             // 다른 토큰 - 하이라이트
//             result += '<span class="word-changed">' + escapeHtml(token) + '</span>';
//         }
//     }
    
//     return result;
// }

// // 토큰 집합 생성 (중복 허용하여 빈도 계산)
// function createTokenSet(tokens) {
//     var tokenMap = {};
//     for (var i = 0; i < tokens.length; i++) {
//         var token = tokens[i];
//         if (tokenMap[token]) {
//             tokenMap[token]++;
//         } else {
//             tokenMap[token] = 1;
//         }
//     }
//     return tokenMap;
// }

// // 토큰이 집합에 존재하는지 확인 (사용 후 카운트 감소)
// function isTokenInSet(token, tokenSet) {
//     if (tokenSet[token] && tokenSet[token] > 0) {
//         tokenSet[token]--; // 사용된 토큰 카운트 감소
//         return true;
//     }
//     return false;
// }


// 순서 기반 정확한 단어 비교 함수
function compareWords(original, modified) {
    var origTokens = tokenizeKorean(original);
    var modTokens = tokenizeKorean(modified);
    
    // 두 문장이 완전히 동일한 경우
    if (original === modified) {
        return {
            originalHtml: escapeHtml(original),
            modifiedHtml: escapeHtml(modified)
        };
    }
    
    // 순서 기반 diff 계산
    var diffResult = calculateOrderedDiff(origTokens, modTokens);
    
    return {
        originalHtml: renderTokensWithHighlight(diffResult.original),
        modifiedHtml: renderTokensWithHighlight(diffResult.modified)
    };
}


// 단순하고 확실한 단어 비교 함수
function compareWords(original, modified) {
    var origTokens = tokenizeKorean(original);
    var modTokens = tokenizeKorean(modified);
    
    // 두 문장이 완전히 동일한 경우
    if (original === modified) {
        return {
            originalHtml: escapeHtml(original),
            modifiedHtml: escapeHtml(modified)
        };
    }
    
    // 단순 집합 기반 비교
    var origHtml = '';
    var modHtml = '';
    
    // 수정본 토큰들을 Set으로 만들기 (중복 제거 안함)
    var modTokenList = modTokens.slice(); // 복사본 생성
    
    // 원본 토큰 처리
    for (var i = 0; i < origTokens.length; i++) {
        var token = origTokens[i];
        var foundIndex = modTokenList.indexOf(token);
        
        if (foundIndex !== -1) {
            // 찾았으면 사용한 토큰 제거하고 하이라이트 안함
            modTokenList.splice(foundIndex, 1);
            origHtml += escapeHtml(token);
        } else {
            // 공백은 하이라이트하지 않음
            if (token.match(/^\s+$/)) {
                origHtml += escapeHtml(token);
            } else {
                // 못 찾았으면 하이라이트
                origHtml += '<span class="word-changed">' + escapeHtml(token) + '</span>';
            }
        }
    }
    
    // 원본 토큰들을 Set으로 만들기 (중복 제거 안함)
    var origTokenList = origTokens.slice(); // 복사본 생성
    
    // 수정본 토큰 처리
    for (var i = 0; i < modTokens.length; i++) {
        var token = modTokens[i];
        var foundIndex = origTokenList.indexOf(token);
        
        if (foundIndex !== -1) {
            // 찾았으면 사용한 토큰 제거하고 하이라이트 안함
            origTokenList.splice(foundIndex, 1);
            modHtml += escapeHtml(token);
        } else {
            // 공백은 하이라이트하지 않음
            if (token.match(/^\s+$/)) {
                modHtml += escapeHtml(token);
            } else {
                // 못 찾았으면 하이라이트
                modHtml += '<span class="word-changed">' + escapeHtml(token) + '</span>';
            }
        }
    }
    
    return {
        originalHtml: origHtml,
        modifiedHtml: modHtml
    };
}



// 한국어 조사 분리 토큰화 함수
function tokenizeKorean(text) {
    var tokens = [];
    var i = 0;
    
    while (i < text.length) {
        var char = text[i];
        
        if (char.match(/\s/)) {
            // 공백 처리
            var spaceStart = i;
            while (i < text.length && text[i].match(/\s/)) {
                i++;
            }
            tokens.push(text.substring(spaceStart, i));
        } else if (char.match(/[가-힣]/)) {
            // 한글 처리 - 조사 분리
            var wordStart = i;
            while (i < text.length && text[i].match(/[가-힣]/)) {
                i++;
            }
            var koreanWord = text.substring(wordStart, i);
            
            // 조사 분리
            var separated = separateParticle(koreanWord);
            for (var j = 0; j < separated.length; j++) {
                tokens.push(separated[j]);
            }
        } else if (char.match(/[a-zA-Z]/)) {
            // 영문 처리
            var wordStart = i;
            while (i < text.length && text[i].match(/[a-zA-Z]/)) {
                i++;
            }
            tokens.push(text.substring(wordStart, i));
        } else if (char.match(/[0-9]/)) {
            // 숫자 처리
            var numStart = i;
            while (i < text.length && text[i].match(/[0-9]/)) {
                i++;
            }
            tokens.push(text.substring(numStart, i));
        } else {
            // 기타 문자 (괄호, 기호 등)
            tokens.push(char);
            i++;
        }
    }
    
    return tokens;
}

// 한국어 조사 분리 함수
function separateParticle(word) {
    if (word.length <= 1) return [word];
    
    // 일반적인 조사 목록
    var particles = [
        '을', '를', '이', '가', '은', '는', '에', '서', '와', '과', '의', '도', '로', '으로', 
        '만', '까지', '부터', '에서', '에게', '한테', '께', '님', '들', '라', '아', '야',
        '에서는', '에서도', '으로는', '으로도', '에게서', '한테서', '께서'
    ];
    
    // 긴 조사부터 먼저 확인 (길이순 정렬)
    particles.sort(function(a, b) { return b.length - a.length; });
    
    for (var i = 0; i < particles.length; i++) {
        var particle = particles[i];
        if (word.endsWith(particle) && word.length > particle.length) {
            var stem = word.substring(0, word.length - particle.length);
            // 어간이 한글이고 의미가 있는 길이인 경우에만 분리
            if (stem.length >= 1 && stem.match(/[가-힣]/)) {
                return [stem, particle];
            }
        }
    }
    
    return [word]; // 조사를 찾지 못한 경우 원본 그대로
}

// HTML 이스케이프 함수
function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 정규식 이스케이프
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 키보드 단축키
function handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'f':
                e.preventDefault();
                searchInput.focus();
                break;
            case 'h':
                e.preventDefault();
                replaceInput.focus();
                break;
            case 'z':
                if (!e.shiftKey) {
                    e.preventDefault();
                    undo();
                }
                break;
            case 'y':
                e.preventDefault();
                redo();
                break;
        }
    }
    
    if (e.key === 'F3') {
        e.preventDefault();
        findNextMatch();
    }
}

// 다음 검색 결과로 이동
function findNextMatch() {
    if (searchMatches.length === 0) return;
    
    currentSearchIndex = (currentSearchIndex + 1) % searchMatches.length;
    scrollToSearchResult();
    toolbarMessage.textContent = '총 ' + searchMatches.length + '개 중 ' + (currentSearchIndex + 1) + '번째 표시중';
}

// 특정 행으로 스크롤
function scrollToRow(lineIndex) {
    var cell = document.querySelector('td.modified[data-line-index="' + lineIndex + '"]');
    if (cell) {
        var row = cell.parentElement;
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        row.style.backgroundColor = '#e3f2fd';
        setTimeout(function() {
            row.style.backgroundColor = '';
        }, 1000);
    }
}

// 이 코드로 교체
function openClaimChecker() {
    console.log('청구항 점검기 열기 시작');
    
    const currentContent = originalText.value.trim();
    if (!currentContent) {
        alert('먼저 보정서를 입력해주세요.');
        return;
    }
    
    // 청구항 추출 (수정된 내용 기준)
    const extractedClaims = extractClaimsFromModifiedContent();
    if (!extractedClaims) {
        alert('청구항을 찾을 수 없습니다.\n\n다음을 확인해주세요:\n- 【청구범위】 섹션이 있는지\n- 【청구항 1】, 【청구항 2】 형식인지');
        return;
    }
    
    console.log('추출된 청구항 길이:', extractedClaims.length);
    
    try {
        // 안전한 URL 생성
        const encodedClaims = btoa(encodeURIComponent(extractedClaims));
        const claimCheckerUrl = `claim-check.html?claims=${encodedClaims}&auto=true`;
        
        // 새 탭으로 열기
        const newWindow = window.open(claimCheckerUrl, '_blank', 'width=1400,height=900');
        
        if (newWindow) {
            newWindow.focus();
            console.log('청구항 점검기가 새 탭에서 열렸습니다.');
            
            if (toolbarMessage) {
                const claimCount = extractedClaims.split(/【청구항\s*\d+】/).length - 1;
                toolbarMessage.textContent = `청구항 점검기 실행됨 (${claimCount}개 청구항) | 수정 완료 후 결과를 복사해서 적용하세요.`;
            }
        } else {
            alert('팝업이 차단되었습니다. 팝업 차단을 해제하고 다시 시도해주세요.');
        }
        
    } catch (error) {
        console.error('URL 생성 오류:', error);
        alert('청구항 데이터가 너무 큽니다. 텍스트를 줄이거나 직접 복사해서 사용해주세요.');
    }
}

function extractClaimsFromModifiedContent() {
    console.log('수정된 명세서에서 청구항 추출 시작');
    
    // 수정된 내용(modifiedLines)에서 청구항 추출
    var modifiedContent = '';
    if (modifiedLines && modifiedLines.length > 0) {
        modifiedContent = modifiedLines.join('\n');
    } else {
        modifiedContent = originalText.value;
    }
    
    console.log('청구항 추출 시작 - 보정서 형식');
    
    // 【청구범위】 섹션 찾기
    var claimScopeStart = modifiedContent.indexOf('【청구범위】');
    if (claimScopeStart === -1) {
        console.log('【청구범위】 섹션을 찾을 수 없음');
        return null;
    }
    
    // 【요약서】 또는 다른 섹션 찾기
    var claimScopeEnd = modifiedContent.indexOf('【요약서】', claimScopeStart);
    if (claimScopeEnd === -1) {
        // 【요약서】가 없으면 다른 섹션들 찾기
        var otherSections = ['【도면의 간단한 설명】', '【발명을 실시하기 위한 구체적인 내용】', '【산업상 이용가능성】'];
        for (var i = 0; i < otherSections.length; i++) {
            claimScopeEnd = modifiedContent.indexOf(otherSections[i], claimScopeStart);
            if (claimScopeEnd !== -1) break;
        }
    }
    
   // 청구범위 섹션 내용 추출 (【청구범위】 제외)
var claimSectionContent;
var startIndex = claimScopeStart + 5; // 【청구범위】 다음부터

// 【청구범위】 다음의 불필요한 문자들(줄바꿈, 공백 등) 건너뛰기
while (startIndex < modifiedContent.length && 
       (modifiedContent[startIndex] === '\n' || 
        modifiedContent[startIndex] === '\r' || 
        modifiedContent[startIndex] === ' ' || 
        modifiedContent[startIndex] === '\t' ||
        modifiedContent[startIndex] === '】')) {
    startIndex++;
}

if (claimScopeEnd !== -1) {
    claimSectionContent = modifiedContent.substring(startIndex, claimScopeEnd);
} else {
    claimSectionContent = modifiedContent.substring(startIndex);
}
    
    console.log('청구범위 섹션 길이:', claimSectionContent.length);
    
    // 원본 텍스트를 그대로 반환 (【청구범위】 제외하고)
    // 앞뒤 불필요한 공백만 제거하되, 내부 형식은 완전히 보존
    var result = claimSectionContent.replace(/^\s+/, '').replace(/\s+$/, '');
    
    if (result.trim()) {
        console.log('청구항 추출 완료 - 원본 형식 보존');
        return result;
    } else {
        console.log('청구항을 찾을 수 없음');
        return null;
    }
}
    

// 청구항 점검기에서 오는 메시지 수신
window.addEventListener('message', function(event) {
    console.log('메시지 수신됨:', event);
    console.log('event.origin:', event.origin);
    console.log('window.location.origin:', window.location.origin);
    
    // origin 체크 완화 (로컬 파일의 경우 null이 될 수 있음)
    if (event.origin !== window.location.origin && 
        event.origin !== 'null' && 
        event.origin !== '') {
        console.log('origin 불일치로 메시지 무시');
        return;
    }
    
    if (event.data && event.data.type === 'SAVE_CLAIMS_TO_AMENDMENT') {
        console.log('청구항 저장 메시지 수신:', event.data);
        
        try {
            const newClaimsText = event.data.claimsText;
            const claimCount = event.data.claimCount;
            
            // 현재 보정서에서 청구항 부분을 수정된 내용으로 교체
            const success = replaceClaimsInCurrentDocument(newClaimsText);
            
            if (success) {
                console.log('청구항 교체 성공');
                
                // 성공 메시지
                if (toolbarMessage) {
                    toolbarMessage.textContent = `✅ ${claimCount}개 청구항이 보정서에 적용되었습니다!`;
                }
                
                // 테이블 재생성 (수정사항 반영)
                if (typeof createTable === 'function') {
                    createTable();
                }
                
                // 성공 알림
                setTimeout(function() {
                    alert(`${claimCount}개의 수정된 청구항이 보정서에 성공적으로 적용되었습니다!`);
                }, 500);
                
            } else {
                console.error('청구항 교체 실패');
                alert('청구항을 보정서에 적용하는데 실패했습니다.');
            }
            
        } catch (error) {
            console.error('청구항 적용 오류:', error);
            alert('청구항을 적용하는 중 오류가 발생했습니다.');
        }
    }
});

// 현재 문서에서 청구항 교체 (기존 함수가 없다면 추가)
function replaceClaimsInCurrentDocument(newClaims) {
    try {
        var currentContent = '';
        if (modifiedLines && modifiedLines.length > 0) {
            currentContent = modifiedLines.join('\n');
        } else {
            currentContent = originalText.value;
        }
        
        var updatedContent = replaceClaimsInAmendment(currentContent, newClaims);
        
        if (updatedContent !== currentContent) {
            // 히스토리 저장
            if (typeof saveToHistory === 'function') {
                saveToHistory();
            }
            
            // 수정된 라인 업데이트
            modifiedLines = updatedContent.split('\n');
            
            console.log('청구항 교체 성공');
            return true;
        } else {
            console.log('청구항 교체 실패 - 패턴을 찾을 수 없음');
            return false;
        }
    } catch (error) {
        console.error('청구항 교체 오류:', error);
        return false;
    }
}

// 보정서에서 청구항 부분 교체 (원본 형식 보존)
function replaceClaimsInAmendment(originalContent, newClaims) {
    // 【청구범위】와 【요약서】 사이의 내용을 새로운 청구항으로 교체
    var claimScopePattern = /【청구범위】([\s\S]*?)【요약서】/;
    var match = originalContent.match(claimScopePattern);
    
    if (match) {
        // 원본의 줄바꿈 형식 분석
        var originalSection = match[1];
        var leadingWhitespace = '';
        var trailingWhitespace = '';
        
        // 앞쪽 공백/줄바꿈 추출
        var leadingMatch = originalSection.match(/^(\s*)/);
        if (leadingMatch) {
            leadingWhitespace = leadingMatch[1];
        }
        
        // 뒤쪽 공백/줄바꿈 추출
        var trailingMatch = originalSection.match(/(\s*)$/);
        if (trailingMatch) {
            trailingWhitespace = trailingMatch[1];
        }
        
        // 원본 형식을 유지하면서 청구항만 교체
        var newClaimSection = '【청구범위】' + leadingWhitespace + newClaims + trailingWhitespace + '【요약서】';
        return originalContent.replace(claimScopePattern, newClaimSection);
    } else {
        // 【요약서】가 없는 경우 - 【청구범위】 이후 모든 내용 교체
        var claimScopeOnlyPattern = /【청구범위】([\s\S]*)/;
        var onlyMatch = originalContent.match(claimScopeOnlyPattern);
        
        if (onlyMatch) {
            // 원본의 줄바꿈 형식 분석
            var originalSection = onlyMatch[1];
            var leadingWhitespace = '';
            
            // 앞쪽 공백/줄바꿈 추출
            var leadingMatch = originalSection.match(/^(\s*)/);
            if (leadingMatch) {
                leadingWhitespace = leadingMatch[1];
            }
            
            return originalContent.replace(claimScopeOnlyPattern, '【청구범위】' + leadingWhitespace + newClaims);
        }
    }
    
    return originalContent; // 패턴을 찾지 못한 경우 원본 반환
}