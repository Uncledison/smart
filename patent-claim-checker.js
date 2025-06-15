// DOM 요소 참조
        const claimInput = document.getElementById('claim-input');
        const checkButton = document.getElementById('check-button');
        const clearButton = document.getElementById('clear-button');
        const fileUploadButton = document.getElementById('file-upload-button');
        const fileInput = document.getElementById('file-input');
        const downloadButton = document.getElementById('download-button');
        const claimDisplay = document.getElementById('claim-display');
        const resultSection = document.getElementById('result-section');
        const resultCategories = document.getElementById('result-categories');
        const claimTreeContainer = document.getElementById('claim-tree-container');
               
        // 전역 변수
        let claims = [];
        let resultsByCategoryMap = new Map(); // 카테고리별 결과를 저장하는 맵
        let aboveReferences = []; // 상기 용어오류 저장
        let invalidCitations = []; // 청구항 번호인용 오류 저장
        let unclearExpressionRefs = []; // 불명확한 용어오류 저장
        let multipleCitationRefs = []; // 다중종속항 인용오류 저장
        let lastWordInconsistencies = []; // 종결어 일치오류 저장
        let alternativeWordErrors = []; // 청구항 택일적 기재오류 저장
        let selectedCategory = null; // 현재 선택된 카테고리
        let currentSelectedCategory = null;
        let isEditing = false; // 편집 상태 추가
        let modifiedClaims = []; // 수정된 청구항 저장
        
        // 한국어 조사 목록 - 조사 인식을 위한 광범위한 목록
        const koreanParticles = [
            '은', '는', '이', '가', '을', '를', '에', '의', '로', '와', '과', 
            '로서', '이면서', '등으로', '이고', '면서', '에서', '라면', '로써',
            '처럼', '보다', '만', '까지', '부터', '에게', '께', '한테', '로부터',
            '중', '중의', '중에', '중에서', '상'
        ];
        
        // 문법적 어미 목록 - 종결어 검출에 사용
        const grammaticalEndings = [
            '하는', '되는', '있는', '시키는', '의', '는', '은', '인', '된', '한', '등'
        ];
        
        // 샘플 청구항
        const sampleClaims = `[청구항 1] 
물체 표면에 부착되는 장치로서, 상기 장치는 물체의 표면과 접촉하는 바닥 본체부재와, 상기 바닥 본체부재 상에 형성되어, 진공력에 의한 흡착부를 가공하는데 필요한 구성구성으로 구성된 장치.

[청구항 2] 
제1항에 있어서, 상기는 원통형 형태를 가지며이고 바닥 본체부를 향하여 오목하게 형성되는 것을 특징으로 하는 발광 다이오드를 포함하는 자동차의 헤드램프 보정을 위한 시스템.

[청구항 3] 
제2항 내지 제1항에 있어서, 파이프에 결합되어 있고 파이프와 하나의 정확한 각도를 형성하는 것을 특징으로 하는 장치.

[청구항 4] 
제5항에 있어서, 상기 파이프는 원형, 삼각형, 오각형 중 하나이면서 대칭적인 형상 모양을 가지며이고 하는 특징으로 하는 장치.

[청구항 5] 
제1항에 있어서, 상기는 원통형 형태를 가지며이고 실질적으로 투명한 굴절 매체 및/또는 다수개의 돌기를 갖는 것을 소망에 따라 특징으로 하는 장치.

[청구항 6] 
제1항에 있어서, 상기 바닥 본체부재는 필요에 따라 대칭 구조를 가지고 성형된 불투명한 소재의 캡과 표면의 대부분이 초특급 매우 질감있는 코팅으로 이루어진 것을 특징으로 하는 장치.

[청구항 7] 
제6항에 있어서, 상기 물체는 실질적으로 평탄한 모니터이고, 상기 모니터의 표시화면과 접촉하고 있는 것을 특징으로 하는 장치. 바람직하게는 상기 모니터는 내부에 적절히 내장된 PCB를 구비하고 있다.

[청구항 8]
제2항에 있어서, 상기 발광 다이오드는 적색, 녹색, 청색 중 하나의 색상을 발광하는 것을 특징으로 하는 장치.

[청구항 9]
제8항에 있어서, 상기 발광 다이오드 센서는 온도 센서와 연결되어 온도에 따라 밝기가 조절되는 것을 특징으로 하는 장치.

[청구항 10]
제3항 또는 제4항에 있어서, 상기 파이프는 금속 재질로 이루어지고, 내부에 냉각수가 순환하는 것을 특징으로 하는 장치.

[청구항 11]
제3항 내지 제4항에 있어서, 상기 파이프는 알루미늄 재질로 제작되는 것을 특징으로 하는 장치.

[청구항 12]
제5항 및 제6항에 있어서, 상기 다수개의 돌기는 공기 흐름을 제어하는 것을 특징으로 하는 장치.

[청구항 13]
제7항 과 제8항에 있어서, 상기 모니터는 LCD 또는 OLED 디스플레이인 것을 특징으로 하는 장치.

[청구항 14]
제9항 , 제10항에 있어서, 상기 센서는 주변 환경에 적응하는 것을 특징으로 하는 장치.

[청구항 15]
제1항 및 제2항 또는 제3항에 있어서, 상기 장치는 이동 가능한 구조를 갖는 것을 특징으로 하는 장치.`;
        // 페이지 로드 시 샘플 청구항 설정
        claimInput.value = sampleClaims;
        
        // 이벤트 리스너 등록
        checkButton.addEventListener('click', () => {
            const text = claimInput.value.trim();
            if (!text) {
                alert('청구항을 입력해주세요.');
                return;
            }
            
            // 청구항 파싱 및 분석
            claims = parseClaimText(text);
            
            // 청구항 점검 전 초기화
            invalidCitations = [];
            aboveReferences = [];
            unclearExpressionRefs = [];
            multipleCitationRefs = [];
            lastWordInconsistencies = [];
            alternativeWordErrors = [];
            resultsByCategoryMap = new Map(); // 카테고리별 결과 초기화
            selectedCategory = null; // 선택된 카테고리 초기화
            
            // 청구항 점검
            checkClaims(claims);
            
            // 수평 레이아웃 설정
            setupHorizontalLayout();
            
            // 청구항 내용 표시 - DOM 조작 방식으로 변경
            displayClaimsDom(claims);
            
            // 점검 결과 표시 (카테고리별로 구분)
            displayResultsByCategory();
            
            // 청구항 종속 관계 트리 생성
            createClaimTree(claims);
            
            // 문서 클릭 이벤트 - 원본 용어 하이라이트 제거
            document.addEventListener('click', (e) => {
                // 상기 참조가 아닌 다른 곳을 클릭한 경우
                if (!e.target.classList.contains('highlight-above-valid') && 
                    !e.target.classList.contains('highlight-above-invalid') &&
                    !e.target.classList.contains('highlight-above-is')) {
                    clearOriginalTermHighlights();
                }
            });
        });
        
        clearButton.addEventListener('click', () => {
            claimInput.value = '';
            claims = [];
            resultsByCategoryMap = new Map();
            aboveReferences = [];
            invalidCitations = [];
            unclearExpressionRefs = [];
            multipleCitationRefs = [];
            lastWordInconsistencies = [];
            alternativeWordErrors = [];
            selectedCategory = null;
            claimDisplay.innerHTML = '';
            resultSection.style.display = 'none';
            claimTreeContainer.innerHTML = '';
        });
        
        
        // 여기에 드래그앤드롭 코드 추가
        claimInput.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // 시각적 피드백 - 테두리 색상 변경
            claimInput.style.borderColor = '#4d86cb';
            claimInput.style.backgroundColor = '#f0f8ff';
        });

        claimInput.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // 원래 스타일로 복원
            claimInput.style.borderColor = '#ccc';
            claimInput.style.backgroundColor = 'white';
        });

        claimInput.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // 스타일 복원
            claimInput.style.borderColor = '#ccc';
            claimInput.style.backgroundColor = 'white';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                
                // 파일 확장자 확인
                const fileExtension = file.name.split('.').pop().toLowerCase();
                
             if (fileExtension === 'txt') {
                    // TXT 파일 처리
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        claimInput.value = event.target.result;
                        alert(`${file.name} 파일이 성공적으로 로드되었습니다.`);
                    };
                    reader.onerror = function() {
                        alert('파일을 읽는 중 오류가 발생했습니다.');
                    };
                    reader.readAsText(file, 'UTF-8');
                } else if (fileExtension === 'docx') {
                    // DOCX 파일 처리
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const arrayBuffer = event.target.result;
                        
                        if (typeof mammoth !== 'undefined') {
                            mammoth.extractRawText({arrayBuffer: arrayBuffer})
                                .then(function(result) {
                                    const text = result.value;
                                    // 텍스트 정리
                                    const cleanedText = text.replace(/[ \t]+/g, ' ')
                                                           .replace(/\n{3,}/g, '\n\n')
                                                           .trim();
                                    claimInput.value = cleanedText;
                                    alert(`${file.name} 파일이 성공적으로 로드되었습니다.`);
                                })
                                .catch(function(err) {
                                    console.error('DOCX 파싱 오류:', err);
                                    alert('DOCX 파일을 읽는 중 오류가 발생했습니다: ' + err.message);
                                });
                        } else {
                            alert('DOCX 파일 처리 라이브러리가 로드되지 않았습니다.');
                        }
                    };
                    reader.onerror = function() {
                        alert('파일을 읽는 중 오류가 발생했습니다.');
                    };
                    reader.readAsArrayBuffer(file);
                } else {
                    alert('TXT 또는 DOCX 파일만 지원됩니다.');
                }
            }
        });

// 파일 업로드 버튼 기능
        fileUploadButton.addEventListener('click', function() {
            fileInput.click();
        });

        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const fileExtension = file.name.split('.').pop().toLowerCase();

            if (fileExtension === 'txt') {
                // TXT 파일 처리
                const reader = new FileReader();
                reader.onload = function(event) {
                    claimInput.value = event.target.result;
                    alert(`${file.name} 파일이 성공적으로 로드되었습니다.`);
                };
                reader.onerror = function() {
                    alert('파일을 읽는 중 오류가 발생했습니다.');
                };
                reader.readAsText(file, 'UTF-8');
           } else if (fileExtension === 'docx') {
                // DOCX 파일 처리
                const reader = new FileReader();
                reader.onload = function(event) {
                    const arrayBuffer = event.target.result;
                    
                    if (typeof mammoth !== 'undefined') {
                        mammoth.extractRawText({arrayBuffer: arrayBuffer})
                            .then(function(result) {
                                const text = result.value;
                                // 텍스트 정리
                                const cleanedText = text.replace(/[ \t]+/g, ' ')
                                                       .replace(/\n{3,}/g, '\n\n')
                                                       .trim();
                                claimInput.value = cleanedText;
                                alert(`${file.name} 파일이 성공적으로 로드되었습니다.`);
                            })
                            .catch(function(err) {
                                console.error('DOCX 파싱 오류:', err);
                                alert('DOCX 파일을 읽는 중 오류가 발생했습니다: ' + err.message);
                            });
                    } else {
                        alert('DOCX 파일 처리 라이브러리가 로드되지 않았습니다.');
                    }
                };
                reader.onerror = function() {
                    alert('파일을 읽는 중 오류가 발생했습니다.');
                };
                reader.readAsArrayBuffer(file);
            } else {
                alert('TXT 또는 DOCX 파일만 지원됩니다.');
            }

            // 파일 입력 초기화 (같은 파일 재선택 가능하게)
            fileInput.value = '';
        });

// 다운로드 기능
        downloadButton.addEventListener('click', function() {
            if (claims.length === 0) {
                alert('다운로드할 청구항이 없습니다.');
                return;
            }
            
            try {
                let downloadText = '';
                
                claims.forEach(claim => {
                    downloadText += `【청구항 ${claim.number}】\n${claim.content}\n\n`;
                });
                
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                
                const dateTimeString = `${year}${month}${day}_${hours}${minutes}`;
                const fileName = `수정본_청구항_${dateTimeString}.txt`;
                
                const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
                const textData = new TextEncoder().encode(downloadText);
                const blob = new Blob([bom, textData], { 
                    type: 'text/plain;charset=utf-8' 
                });
                
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.style.display = 'none';
                
                document.body.appendChild(a);
                a.click();
                
                setTimeout(function() {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
                
                alert(`${fileName} 파일이 다운로드되었습니다.`);
                
            } catch (error) {
                console.error('다운로드 오류:', error);
                alert('다운로드 실패. 브라우저가 다운로드를 지원하지 않습니다.');
            }
        });



        // 보정서에 저장 기능
const saveToAmendmentButton = document.getElementById('save-to-amendment-button');
if (saveToAmendmentButton) {
    saveToAmendmentButton.addEventListener('click', function() {
        if (claims.length === 0) {
            alert('저장할 청구항이 없습니다.');
            return;
        }
        
        try {
            console.log('보정서에 청구항 저장 시작');
            
        // 수정된 청구항 텍스트 생성 (원본 형식 보존)
        let updatedClaimsText = '';

        claims.forEach((claim, index) => {
            // 원본 형식 정보를 활용하여 청구항 생성
            if (claim.originalContent) {
                // 원본에서 청구항 번호 뒤의 형식 그대로 사용
                updatedClaimsText += `【청구항 ${claim.number}】${claim.originalContent}`;
            } else {
                // 원본 정보가 없는 경우 기본 형식 사용
                updatedClaimsText += `【청구항 ${claim.number}】\n${claim.content}`;
            }
            
            
        });
            
            console.log('생성된 청구항 텍스트 길이:', updatedClaimsText.length);
            
            // 부모 창(스마트 보정서)에 메시지 전송
            if (window.opener && !window.opener.closed) {
                const message = {
                    type: 'SAVE_CLAIMS_TO_AMENDMENT',
                    claimsText: updatedClaimsText,
                    claimCount: claims.length
                };
                
                window.opener.postMessage(message, '*');
                console.log('부모 창에 메시지 전송 완료');
                
                // 성공 메시지 표시
                alert(`${claims.length}개의 청구항이 보정서에 저장되었습니다.\n\n창을 닫으셔도 됩니다.`);
                
            } else {
                console.error('부모 창을 찾을 수 없음');
                alert('보정서 창을 찾을 수 없습니다.\n보정서 창이 닫혔거나 접근할 수 없습니다.');
            }
            
        } catch (error) {
            console.error('보정서 저장 오류:', error);
            alert('보정서에 저장하는 중 오류가 발생했습니다.');
        }
    });
}

// 편집 기능 함수들
    function startEditing(claimElement, claimNumber) {
            if (isEditing) return;
            
            isEditing = true;
            const claimContent = claimElement.querySelector('.claim-content');
            
            // 원본 청구항 텍스트 가져오기 (툴팁 제외)
            const claimNumber_int = parseInt(claimNumber);
            const claim = claims.find(c => c.number === claimNumber_int);
            const currentText = claim ? claim.content : '';
            
            claimContent.classList.add('editing');
            
            const textarea = document.createElement('textarea');
            textarea.className = 'inline-editor';
            textarea.value = currentText;
            
            const buttonDiv = document.createElement('div');
            buttonDiv.className = 'edit-buttons';
            
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'edit-btn cancel';
            cancelBtn.textContent = '취소';
            cancelBtn.addEventListener('click', function() {
                cancelEditing(claimElement, currentText);
            });
            
            const saveBtn = document.createElement('button');
            saveBtn.className = 'edit-btn save';
            saveBtn.textContent = '저장';
            saveBtn.addEventListener('click', function() {
                saveEditing(claimElement, claimNumber, textarea.value);
            });
            
            buttonDiv.appendChild(cancelBtn);
            buttonDiv.appendChild(saveBtn);
            
            claimContent.innerHTML = '';
            claimContent.appendChild(textarea);
            claimContent.appendChild(buttonDiv);
            
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
            
            textarea.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    saveEditing(claimElement, claimNumber, textarea.value);
                } else if (e.key === 'Escape') {
                    cancelEditing(claimElement, currentText);
                }
            });
        }
        
         function saveEditing(claimElement, claimNumber, newText) {
    const claim = claims.find(c => c.number === claimNumber);
    if (claim) {
        claim.content = newText;
        
        // 원본 형식 패턴 추출 및 보존
        if (claim.originalContent) {
            // 원본 내용을 분석하여 실제 청구항 내용 부분을 찾음
            // 원본 형식: "앞부분공백/줄바꿈 + 실제내용 + 뒷부분공백/줄바꿈"
            
            // 실제 내용 부분을 찾기 위해 앞뒤 공백을 제거한 원본 내용과 비교
            const trimmedOriginal = claim.originalContent.trim();
            const trimmedCurrentContent = claim.content.trim();
            
            // 원본에서 실제 내용의 시작과 끝 위치를 찾음
            const contentStartIndex = claim.originalContent.indexOf(trimmedOriginal);
            const contentEndIndex = contentStartIndex + trimmedOriginal.length;
            
            // 앞부분 형식(공백/줄바꿈) 추출
            const leadingFormat = claim.originalContent.substring(0, contentStartIndex);
            // 뒷부분 형식(공백/줄바꿈) 추출  
            const trailingFormat = claim.originalContent.substring(contentEndIndex);
            
            // 원본 형식을 유지하면서 내용만 교체
            claim.originalContent = leadingFormat + newText + trailingFormat;
        } else {
            // originalContent가 없는 경우 기본 형식으로 설정
            claim.originalContent = '\n' + newText + '\n\n';
        }
    }
    
    // 수정된 청구항 저장
    const existingIndex = modifiedClaims.findIndex(mc => mc.number === claimNumber);
    if (existingIndex >= 0) {
        modifiedClaims[existingIndex].content = newText;
    } else {
        modifiedClaims.push({number: claimNumber, content: newText});
    }
    
    // 상단 입력칸 업데이트
    updateClaimInput();
    
    finishEditing(claimElement, newText);
    alert(`청구항 ${claimNumber}이 수정되었습니다.`);
}
        
        function updateClaimInput() {
            // 전체 청구항을 다시 조합해서 상단 입력칸 업데이트
            let updatedText = '';
            claims.forEach((claim, index) => {
                updatedText += `【청구항 ${claim.number}】\n${claim.content}`;
                // 마지막 청구항이 아닌 경우에만 구분자 추가
                    if (index < claims.length - 1) {
                        // originalContent가 이미 줄바꿈으로 끝나는지 확인
                        const endsWithNewline = claim.originalContent && claim.originalContent.endsWith('\n');
                        if (!endsWithNewline) {
                            updatedText += '\n\n';  // ← 올바른 변수명
                        } else {
                            updatedText += '\n'; // ← 올바른 변수명
                        }
                }
            });
            claimInput.value = updatedText;
        }

        function saveAndRecheck(claimElement, claimNumber, newText) {
            // 먼저 저장
            const claim = claims.find(c => c.number === claimNumber);
            if (claim) {
                claim.content = newText;
            }
            
            // 수정된 청구항 저장
            const existingIndex = modifiedClaims.findIndex(mc => mc.number === claimNumber);
            if (existingIndex >= 0) {
                modifiedClaims[existingIndex].content = newText;
            } else {
                modifiedClaims.push({number: claimNumber, content: newText});
            }
            
            // 상단 입력칸 업데이트
            updateClaimInput();
            
            // 편집 모드 종료
            finishEditing(claimElement, newText);
            
            // 청구항 점검 실행
            setTimeout(() => {
                checkButton.click();
            }, 100);
            
            alert(`청구항 ${claimNumber}이 수정되고 재점검되었습니다.`);
        }

        function cancelEditing(claimElement, originalText) {
            finishEditing(claimElement, originalText);
        }
        
        function finishEditing(claimElement, text) {
            isEditing = false;
            const claimContent = claimElement.querySelector('.claim-content');
            claimContent.classList.remove('editing');
            claimContent.textContent = text;
        }

        // 수평 레이아웃 설정 함수
        function setupHorizontalLayout() {
            // 결과 섹션에 수평 레이아웃 클래스 추가
            resultSection.classList.add('horizontal-layout');
            
            // 청구항 표시 영역이 결과 섹션 내부로 이동하도록 DOM 재구성
            if (!document.querySelector('#result-section #claim-display')) {
                const claimDisplayClone = claimDisplay.cloneNode(false);
                claimDisplayClone.id = 'claim-display-right';
                resultSection.appendChild(claimDisplayClone);
                
                // 기존 청구항 표시 영역 숨김
                claimDisplay.style.display = 'none';
            }
        }
        
        // 정규식 특수문자 이스케이프 함수
        function escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
        
        // HTML 특수문자 이스케이프 함수
        function escapeHtml(unsafe) {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
        
        // 정규식과 일치하는 모든 항목 찾기
        function findAllMatches(text, regex) {
            const matches = [];
            let regexObj;
            
            if (typeof regex === 'string') {
                regexObj = new RegExp(regex, 'g');
            } else {
                // 이미 RegExp 객체인 경우, global 플래그 확인 
                regexObj = regex.global ? regex : new RegExp(regex.source, regex.flags + 'g');
            }
            
            let match;
            while ((match = regexObj.exec(text)) !== null) {
                matches.push({
                    index: match.index,
                    text: match[0],
                    groups: match.slice(1),
                    length: match[0].length
                });
            }
            
            return matches;
        }
        
        // 청구항 텍스트 파싱 함수
        function parseClaimText(text) {
            // 두 가지 형식 모두 지원: [청구항 1]과 【청구항 1】
            const claimPattern = /(?:\[청구항\s*(\d+)\]|【청구항\s*(\d+)】)([\s\S]*?)(?=(?:\[청구항\s*\d+\]|【청구항\s*\d+】)|$)/g;
            const claims = [];
            let match;
            
            while ((match = claimPattern.exec(text)) !== null) {
                const claimNumber = parseInt(match[1] || match[2]);
                const claimContent = match[3].trim(); // 분석용
                // 수정된 코드
                let originalClaimContent = match[3]; // 원본 형식 보존용
                // 끝부분의 과도한 줄바꿈만 제거 (다음 청구항 제목은 이미 제외됨)
                originalClaimContent = originalClaimContent.replace(/\s+$/, '\n\n');
                const vagueCitations = findVagueCitations(claimContent);
                const invalidRangeResult = checkInvalidRange(claimContent);
                const lastWordInfo = findLastWord(claimContent);
                const alternativeWordErrors = checkAlternativeWord(claimContent);
                
                claims.push({
                    number: claimNumber,
                    content: claimContent,
                    originalContent: originalClaimContent, // 원본 형식 보존
                    citations: findCitations(claimContent),
                    lastWord: lastWordInfo.word,
                    lastWordInfo: lastWordInfo,
                    vagueCitations: vagueCitations,
                    hasVagueCitation: vagueCitations.length > 0,
                    hasInvalidRange: invalidRangeResult.hasInvalidRange,
                    invalidRangeData: invalidRangeResult.match ? invalidRangeResult.match : null,
                    aboveIsReferences: findAboveIsReferences(claimContent),
                    alternativeWordErrors: alternativeWordErrors
                });
            }
            
            return claims;
        }
        
        // 청구항 택일적 기재오류 점검 (종속항에 택일적 기재 사용하지 않는 경우)
        function checkAlternativeWord(text) {
            const errors = [];
            
            // 1. "제X항 및 제Y항에 있어서" 패턴 확인 ("어느"가 없는 경우 오류)
            const conjunctivePattern = /제\s*(\d+)\s*항\s*(및|내지|와|과|,)\s*제\s*(\d+)\s*항(?!\s*(?:중|의|에서)\s*어느)/;
            let match = text.match(conjunctivePattern);
            if (match) {
                errors.push({
                    pattern: match[0],
                    type: 'missing-alternative',
                    index: match.index,
                    length: match[0].length,
                    expectedModifier: '어느',
                    message: '택일적 기재 "어느"가 누락되었습니다.'
                });
            }
            
            // 2. "제X항 및 제Y항 또는 제Z항에 있어서" 패턴 확인 (및/또는 혼용 오류)
            const mixedPattern = /제\s*(\d+)\s*항\s*(및|내지|와|과)\s*제\s*(\d+)\s*항\s*(또는|혹은)\s*제\s*(\d+)\s*항/;
            match = text.match(mixedPattern);
            if (match) {
                errors.push({
                    pattern: match[0],
                    type: 'mixed-conjunctions',
                    index: match.index,
                    length: match[0].length,
                    conjunctions: [match[2], match[4]],
                    message: '"및"과 "또는"을 함께 사용할 수 없습니다.'
                });
            }
            
            return errors;
        }
        
        // 종결어 찾기 함수 개선 버전
        function findLastWord(text) {
            // 괄호 내용 제거 (위치 계산을 위해 원본 텍스트도 보존)
            const originalText = text;
            let processedText = text.replace(/\([^)]*\)/g, ' ');
            
            // 콜론(:)이 있는 경우 콜론 이전까지만 고려
            if (processedText.includes('하기:') || processedText.includes('하기 :')) {
                const colonIndex = processedText.indexOf(':');
                if (colonIndex > 0) {
                    processedText = processedText.substring(0, colonIndex);
                }
            }
            
            // 공백, 쉼표, 마침표로 끝나는 경우 제거
            processedText = processedText.trim().replace(/[\s,.]+$/, '');
            
            // 특허 청구항의 일반적인 종결어 목록
            const endingWords = ['장치', '방법', '시스템', '물질', '화합물', '조성물', '제품', '센서'];
            
            // 문장의 마지막 부분 추출
            const parts = processedText.split(/\s+/);
            const lastPart = parts[parts.length - 1].replace(/[,.;)]+$/, '');
            
            // 문장 끝이 종결어 목록에 있는지 확인
            let endingWord = null;
            let position = null;
            
            for (const word of endingWords) {
                if (lastPart === word || lastPart.endsWith(word)) {
                    endingWord = word;
                    // 원본 텍스트에서 마지막 단어의 위치 찾기
                    const lastIndex = originalText.lastIndexOf(word);
                    position = {
                        start: lastIndex,
                        end: lastIndex + word.length
                    };
                    break;
                }
            }
            
            // 종결어가 발견되지 않은 경우 마지막 단어 사용
            if (!endingWord) {
                // 문법적 어미 뒤에 오는 단어 검색
                const tokens = processedText.split(/\s+/);
                let lastToken = tokens[tokens.length - 1];
                
                // 마지막 단어에서 조사 제거
                for (const particle of koreanParticles) {
                    if (lastToken.endsWith(particle) && lastToken.length > particle.length) {
                        lastToken = lastToken.substring(0, lastToken.length - particle.length);
                        break;
                    }
                }
                
                endingWord = lastToken;
                const lastIndex = originalText.lastIndexOf(lastToken);
                position = {
                    start: lastIndex,
                    end: lastIndex + lastToken.length
                };
            }
            
            return {
                word: endingWord,
                position: position
            };
        }
        
        // 인용항 찾기 함수 (텍스트 및 정보 모두 반환)
        function findCitationsWithData(text) {
            const citationPattern = /(?:제\s*(\d+)\s*항|청구항\s*(\d+)(?:\s*항)?)/g;
            const citations = [];
            let match;
            
            while ((match = citationPattern.exec(text)) !== null) {
                const citationNumber = parseInt(match[1] || match[2]);
                
                citations.push({
                    number: citationNumber, 
                    text: match[0],
                    index: match.index,
                    length: match[0].length
                });
            }
            
            return citations;
        }
        
        // 인용항 찾기 함수 (번호만 반환)
        function findCitations(text) {
            const citationsWithData = findCitationsWithData(text);
            return [...new Set(citationsWithData.map(c => c.number))]; // 중복 제거한 번호만 반환
        }
        
        // 불명확한 인용 찾기 함수 (위 항, 위의 항, 상기의 항, 선행하는 항 등)
        function findVagueCitations(text) {
            const vaguePattern = /(위\s*항|위의\s*항|상기의?\s*항|선행하는\s*항|앞의\s*항|이전\s*항)/g;
            const vagueCitations = [];
            let match;
            
            while ((match = vaguePattern.exec(text)) !== null) {
                vagueCitations.push({
                    text: match[1],
                    index: match.index,
                    length: match[1].length
                });
            }
            
            return vagueCitations;
        }
        
        // "상기는" 표현 찾기 함수
        function findAboveIsReferences(text) {
            const aboveIsPattern = /상기는(?!\s*[가-힣]+[은는이가을를에서와과])/g;
            const matches = [];
            let match;
            
            while ((match = aboveIsPattern.exec(text)) !== null) {
                matches.push({
                    index: match.index,
                    text: match[0]
                });
            }
            
            return matches;
        }
        
        // 단어에서 조사 분리 함수 - 개선된 버전
        function extractBaseWord(word) {
            for (const particle of koreanParticles) {
                if (word.endsWith(particle) && word.length > particle.length) {
                    return word.substring(0, word.length - particle.length);
                }
            }
            return word; // 조사가 없으면 원래 단어 반환
        }
        
        // 잘못된 범위 체크 함수
        function checkInvalidRange(text) {
            const rangePattern = /제\s*(\d+)\s*항\s*(?:내지|부터|~)\s*제\s*(\d+)\s*항/g;
            let match;
            let hasInvalidRange = false;
            let matchData = null;
            
            while ((match = rangePattern.exec(text)) !== null) {
                const start = parseInt(match[1]);
                const end = parseInt(match[2]);
                if (start >= end) {
                    hasInvalidRange = true;
                    matchData = {
                        text: match[0],
                        index: match.index,
                        length: match[0].length,
                        start: start,
                        end: end
                    };
                    break;
                }
            }
            
            return {
                hasInvalidRange: hasInvalidRange,
                match: matchData
            };
        }
        
        // 청구항 점검 함수 - 카테고리별로 결과 저장하도록 수정
        function checkClaims(claims) {
            invalidCitations = []; // 오참조 초기화
            aboveReferences = []; // 상기 용어오류 참조 초기화
            unclearExpressionRefs = []; // 불명확한 용어오류 초기화
            multipleCitationRefs = []; // 다중종속항 인용오류 초기화
            lastWordInconsistencies = []; // 종결어 일치오류 초기화
            alternativeWordErrors = []; // 청구항 택일적 기재오류 초기화
            
            claims.forEach(claim => {
                // 1. 청구항번호 인용오류 점검
                checkWrongCitations(claim, claims);
                
                
                // 2. 다중종속항 인용오류 점검
                checkMultipleCitations(claim, claims);
                
                
                // 3. 종결어 일치오류 점검
                checkLastWordConsistency(claim, claims);
                                
                // 4. 상기 용어오류 점검
                checkAboveCitations(claim, claims);
                    
                    // "상기는" 표현 점검
                    if (claim.aboveIsReferences && claim.aboveIsReferences.length > 0) {
                        addResultToCategory('상기 용어오류', {
                            claimNumber: claim.number,
                            result: `청구항 ${claim.number}에서 '상기는'이라는 표현은 지칭하는 대상이 불명확합니다.`,
                            lawReference: '특허법 제42조제4항제2호'
                        });
                    }
                
                
                // 5. 불명확한 용어오류 점검
                checkUnclearExpressions(claim);
                                
                // 6. 불명확한 인용 점검
                if (claim.vagueCitations.length > 0) {
                    addResultToCategory('청구항번호 인용오류', {
                        claimNumber: claim.number,
                        result: `청구항 ${claim.number}는 인용하는 청구항이 특정되지 않았습니다.`,
                        lawReference: '특허법 제42조제4항제2호'
                    });
                    
                    // 불명확한 인용을 오참조에 추가
                    claim.vagueCitations.forEach(vagueRef => {
                        invalidCitations.push({
                            claimNumber: claim.number,
                            type: 'vague-citation',
                            citation: vagueRef.text,
                            index: vagueRef.index,
                            length: vagueRef.length
                        });
                    });
                }
                
                // 7. 청구항 택일적 기재오류 점검
                if (claim.alternativeWordErrors.length > 0) {
                    claim.alternativeWordErrors.forEach(error => {
                        // 결과 저장
                        addResultToCategory('청구항 택일적 기재오류', {
                            claimNumber: claim.number,
                            result: error.type === 'missing-alternative' ?
                                `청구항 ${claim.number}에서 복수 청구항 인용 시 택일적 기재("어느")가 누락되었습니다.` :
                                `청구항 ${claim.number}에서 "및"과 "또는"을 함께 사용할 수 없습니다.`,
                            lawReference: '특허법 시행령 제5조제5항' // 수정된 법조항 참조
                        });
                        
                        // 청구항 택일적 기재오류 위치 정보 저장
                        alternativeWordErrors.push({
                            claimNumber: claim.number,
                            pattern: error.pattern,
                            type: error.type,
                            index: error.index,
                            length: error.length,
                            message: error.message
                        });
                    });
                }
            });
        }
        
        // 결과를 카테고리별로 저장하는 함수
        function addResultToCategory(category, result) {
            if (!resultsByCategoryMap.has(category)) {
                resultsByCategoryMap.set(category, []);
            }
            resultsByCategoryMap.get(category).push(result);
        }
        
        // 청구항번호 인용오류 점검
        function checkWrongCitations(claim, claims) {
            if (claim.citations.length === 0 && !claim.hasVagueCitation) return;
            
            const maxClaimNumber = Math.max(...claims.map(c => c.number));
            const citationsWithData = findCitationsWithData(claim.content);
            
            // 자기 자신을 참조하는 경우
            if (claim.citations.includes(claim.number)) {
                addResultToCategory('청구항번호 인용오류', {
                    claimNumber: claim.number,
                    result: `청구항 ${claim.number}은(는) 자기 자신을 참조하고 있습니다.`,
                    lawReference: '특허법 제42조제4항제2호'
                });
                
                // 자기 참조 모두 저장
                citationsWithData.forEach(citation => {
                    if (citation.number === claim.number) {
                        invalidCitations.push({
                            claimNumber: claim.number,
                            type: 'self-reference',
                            citation: citation.text,
                            index: citation.index,
                            length: citation.length
                        });
                    }
                });
            }
            
            // 더 큰 번호의 청구항을 참조하는 경우
            const biggerCitations = citationsWithData.filter(c => c.number > claim.number);
            if (biggerCitations.length > 0) {
                addResultToCategory('청구항번호 인용오류', {
                    claimNumber: claim.number,
                    result: `청구항 ${claim.number}은(는) 자신보다 큰 번호의 청구항(${biggerCitations.map(c => c.number).join(', ')})을 참조하고 있습니다.`,
                    lawReference: '특허법 제42조제4항제2호'
                });
                
                // 큰 번호 참조 모두 저장
                biggerCitations.forEach(citation => {
                    invalidCitations.push({
                        claimNumber: claim.number,
                        type: 'bigger-reference',
                        citation: citation.text,
                        index: citation.index,
                        length: citation.length
                    });
                });
            }
            
            // 존재하지 않는 청구항을 참조하는 경우
            const invalidCitationData = citationsWithData.filter(c => 
                c.number > maxClaimNumber || !claims.some(cl => cl.number === c.number)
            );
            
            if (invalidCitationData.length > 0) {
                addResultToCategory('청구항번호 인용오류', {
                    claimNumber: claim.number,
                    result: `청구항 ${claim.number}은(는) 존재하지 않는 청구항(${invalidCitationData.map(c => c.number).join(', ')})을 참조하고 있습니다.`,
                    lawReference: '특허법 제42조제4항제2호'
                });
                
                // 존재하지 않는 청구항 참조 모두 저장
                invalidCitationData.forEach(citation => {
                    invalidCitations.push({
                        claimNumber: claim.number,
                        type: 'invalid-citation',
                        citation: citation.text,
                        index: citation.index,
                        length: citation.length
                    });
                });
            }
            
            // 잘못된 범위 체크
            if (claim.hasInvalidRange) {
                addResultToCategory('청구항번호 인용오류', {
                    claimNumber: claim.number,
                    result: `청구항 ${claim.number}은(는) 명시적 연속항의 범위기재가 올바르지 않습니다. (예: '제2항 내지 제1항')`,
                    lawReference: '특허법 제42조제4항제2호'
                });
                
                // 잘못된 범위 저장
                if (claim.invalidRangeData) {
                    invalidCitations.push({
                        claimNumber: claim.number,
                        type: 'invalid-range',
                        citation: claim.invalidRangeData.text,
                        index: claim.invalidRangeData.index,
                        length: claim.invalidRangeData.length
                    });
                }
            }
        }
        
        // 다중종속항 인용오류 점검
        function checkMultipleCitations(claim, claims) {
            if (claim.citations.length <= 1) return;
            
            const multClaims = claims.filter(c => c.citations.length > 1);
            
            // 다중 인용 청구항을 참조하는 다른 청구항 검사
            for (const otherClaim of claims) {
                if (otherClaim.number === claim.number) continue;
                
                const hasCitation = otherClaim.citations.includes(claim.number);
                if (hasCitation && otherClaim.citations.length > 1) {
                    const matchingClaim = claim.number;
                    
                    addResultToCategory('다중종속항 인용오류', {
                        claimNumber: otherClaim.number,
                        result: `청구항 ${otherClaim.number}은(는) 다중 인용 청구항(${matchingClaim})을 참조하고 있습니다.`,
                        lawReference: '특허법시행령 제5조제6항'
                    });
                    
                    // 인용 텍스트 찾기
                    const citationPattern = new RegExp(`제\\s*${matchingClaim}\\s*항|청구항\\s*${matchingClaim}(?:\\s*항)?`, 'g');
                    let match;
                    
                    while ((match = citationPattern.exec(otherClaim.content)) !== null) {
                        multipleCitationRefs.push({
                            claimNumber: otherClaim.number,
                            citedClaimNumber: matchingClaim,
                            citation: match[0],
                            index: match.index,
                            length: match[0].length
                        });
                    }
                }
            }
        }
        
        // 종결어 일치오류 점검 - 개선된 버전
        function checkLastWordConsistency(claim, claims) {
            if (claim.citations.length === 0) return; // 독립항은 건너뜀
            
            // 참조하는 독립항 찾기
            let independentClaim = null;
            for (const citation of claim.citations) {
                const citedClaim = claims.find(c => c.number === citation);
                if (citedClaim && citedClaim.citations.length === 0) {
                    independentClaim = citedClaim;
                    break;
                }
            }
            
            // 독립항과 종속항의 종결어 비교
            if (independentClaim && claim.lastWord !== independentClaim.lastWord) {
                addResultToCategory('종결어 일치오류', {
                    claimNumber: claim.number,
                    result: `청구항 ${claim.number}의 종결어(${claim.lastWord})가 인용하는 독립항 ${independentClaim.number}의 종결어(${independentClaim.lastWord})와 일치하지 않습니다.`,
                    lawReference: '특허법 제42조 제4항 제2호'
                });
                
                // 종결어 일치오류 정보 저장
                lastWordInconsistencies.push({
                    claimNumber: claim.number,
                    dependentWord: claim.lastWord,
                    position: claim.lastWordInfo.position,
                    independentClaimNumber: independentClaim.number,
                    independentWord: independentClaim.lastWord
                });
            }
        }
        
        // 상기 용어오류 점검 함수
        function checkAboveCitations(claim, allClaims) {
            // 1. '상기는' 패턴 먼저 검출
            const aboveIsPattern = /상기는(?!\s*[가-힣]+[은는이가을를에서와과])/g;
            let aboveIsMatch;
            
            while ((aboveIsMatch = aboveIsPattern.exec(claim.content)) !== null) {
                aboveReferences.push({
                    claimNumber: claim.number,
                    term: '는',
                    baseForm: '는',
                    isValid: false,
                    matchStart: aboveIsMatch.index,
                    matchEnd: aboveIsMatch.index + 3, // '상기는' 길이
                    tooltipMessage: "'상기는'이라는 표현은 지칭하는 대상이 불명확합니다.",
                    fullMatch: '상기는',
                    isAboveIs: true
                });
            }
            
            // 2. 일반 '상기 + 용어' 패턴 검출
            const abovePattern = /상기\s+([가-힣a-zA-Z0-9\s]+?)(?:([은는이가을를에의로와과로서이면서등으로이고면서에서라면로써처럼보다만까지부터에게께한테로부터중중의중에중에서상])(?:\s|$|\.|\,)|\s*(?:$|\.|\,))/g;
            
            const claimText = claim.content;
            let match;
            
            while ((match = abovePattern.exec(claimText)) !== null) {
                // "상기는"으로 시작하는 경우 제외 (이미 위에서 처리)
                if (match[1].trim() === "는") continue;
                
                // 상기 다음의 용어 추출 (조사 제외)
                const fullTerm = match[1].trim();
                const particle = match[2] ? match[2] : ''; // 조사 (있는 경우)
                
                // 추출된 용어에서 앞부분에 띄어쓰기가 있는지 확인 (복합명사)
                let baseTerms = [];
                if (fullTerm.includes(' ')) {
                    // 복합명사인 경우 (예: "바닥 본체부재")
                    baseTerms = [fullTerm];
                } else {
                    // 단일 명사인 경우
                    baseTerms = [fullTerm];
                }
                
                // 1. 현재 청구항 내 "상기" 표현 이전 부분 추출
                const aboveIndex = claimText.indexOf('상기 ' + fullTerm);
                const precedingText = aboveIndex > 0 ? claimText.substring(0, aboveIndex) : '';
                
                // 2. 용어가 이전에 정의되었는지 검색
                let found = false;
                let foundInClaims = [];
                
                // 2.1 현재 청구항 내 검색
                for (const term of baseTerms) {
                    if (findTermWithParticles(precedingText, term)) {
                        found = true;
                        foundInClaims.push(claim.number);
                        break;
                    }
                }
                
                // 2.2 인용된 청구항 검색
                if (!found && claim.citations.length > 0) {
                    for (const citedNumber of claim.citations) {
                        const citedClaim = allClaims.find(c => c.number === citedNumber);
                        if (citedClaim) {
                            let foundInCited = false;
                            
                            // 직접 인용된 청구항에서 검색
                            for (const term of baseTerms) {
                                if (findTermWithParticles(citedClaim.content, term)) {
                                    foundInCited = true;
                                    foundInClaims.push(citedNumber);
                                    break;
                                }
                            }
                            
                            // 인용 체인 따라 재귀 검색
                            if (!foundInCited && citedClaim.citations.length > 0) {
                                const chainResult = searchTermInChain(citedClaim, allClaims, baseTerms[0]);
                                if (chainResult.found) {
                                    foundInCited = true;
                                    foundInClaims.push(...chainResult.foundInClaims);
                                }
                            }
                            
                            if (foundInCited) {
                                found = true;
                            }
                        }
                    }
                }
                
                // 3. 결과 처리
                const fullMatchWithoutSuffix = '상기 ' + fullTerm; // 조사 제외한 매치
                const fullMatchWithSuffix = fullMatchWithoutSuffix + (particle ? particle : ''); // 조사 포함한 매치
                
                if (!found) {
                    // 상기 용어오류 오류 저장
                    addResultToCategory('상기 용어오류', {
                        claimNumber: claim.number,
                        result: `청구항 ${claim.number}에서 '상기 ${fullTerm}'가 이전에 정의되지 않았습니다.`,
                        lawReference: '특허법 제42조 제4항 제2호',
                        errorTerm: fullTerm
                    });
                    
                    // 참조 정보 저장 (조사 제외하고 저장)
                    aboveReferences.push({
                        claimNumber: claim.number,
                        term: fullTerm,
                        baseForm: fullTerm,
                        isValid: false,
                        matchStart: match.index,
                        matchEnd: match.index + fullMatchWithoutSuffix.length,
                        tooltipMessage: `"${fullTerm}" 용어를 찾을 수 없습니다.`,
                        fullMatch: fullMatchWithoutSuffix,
                        fullMatchOriginal: fullMatchWithSuffix,
                        particleLength: particle ? particle.length : 0
                    });
                } else {
                    // 유효한 참조 정보 저장 (조사 제외하고 저장)
                    aboveReferences.push({
                        claimNumber: claim.number,
                        term: fullTerm,
                        baseForm: fullTerm,
                        isValid: true,
                        matchStart: match.index,
                        matchEnd: match.index + fullMatchWithoutSuffix.length,
                        tooltipMessage: `"${fullTerm}" 용어 발견 위치: 청구항 ${[...new Set(foundInClaims)].join(', ')}`,
                        fullMatch: fullMatchWithoutSuffix,
                        fullMatchOriginal: fullMatchWithSuffix,
                        particleLength: particle ? particle.length : 0
                    });
                }
            }
        }
        
        // 조사를 고려한 정확한 용어 검색 함수
        function findTermWithParticles(text, term) {
            if (!term || term.length === 0) return false;
            
            // 1. 단순 포함 여부 검사 (정확한 단어 매칭)
            if (text.includes(term)) {
                return true;
            }
            
            // 2. 조사가 붙은 형태 검사
            for (const particle of koreanParticles) {
                const termWithParticle = term + particle;
                // 단어 경계를 고려한 검색
                if (text.includes(termWithParticle + ' ') || 
                    text.includes(termWithParticle + '.') || 
                    text.includes(termWithParticle + ',')) {
                    return true;
                }
            }
            
            // 3. 공백 무시 검색 (복합명사)
            if (term.includes(' ')) {
                const noSpaceTerm = term.replace(/\s+/g, '');
                const noSpaceText = text.replace(/\s+/g, '');
                if (noSpaceText.includes(noSpaceTerm)) {
                    return true;
                }
            }
            
            return false;
        }
        
        // 인용 체인을 따라 용어 검색
        function searchTermInChain(claim, allClaims, searchTerm) {
            const foundInClaims = [];
            const visitedClaims = new Set();
            
            function recursiveSearch(currentClaim) {
                if (visitedClaims.has(currentClaim.number)) return false;
                visitedClaims.add(currentClaim.number);
                
                if (findTermWithParticles(currentClaim.content, searchTerm)) {
                    foundInClaims.push(currentClaim.number);
                    return true;
                }
                
                // 인용된 청구항을 따라 재귀적으로 검색
                let foundInCitations = false;
                for (const citedNumber of currentClaim.citations) {
                    const citedClaim = allClaims.find(c => c.number === citedNumber);
                    if (citedClaim && recursiveSearch(citedClaim)) {
                        foundInCitations = true;
                    }
                }
                
                return foundInCitations;
            }
            
            recursiveSearch(claim);
            return {
                found: foundInClaims.length > 0,
                foundInClaims: foundInClaims
            };
        }
        
        // 불명확한 용어오류 점검
        function checkUnclearExpressions(claim) {
            const unclearExpressions = [
                '소망에 따라', '필요에 따라', '특히', '예를 들어', '예를 들면', '주로', 
                '주성분으로', '적합한', '적합하게', '적량의', '적당한', '적당하게', '적절하게', 
                '적절한', '울트라', '초특급', '매우', '슈퍼', '많은', '높은', '대부분의', '거의', 
                '대략', '약', '을 제외하고', '바람직하게', '이 아닌', '최적', '및/또는'
            ];
            
            for (const expression of unclearExpressions) {
                if (claim.content.includes(expression)) {
                    addResultToCategory('불명확한 용어오류', {
                        claimNumber: claim.number,
                        result: `청구항 ${claim.number}에 불명확한 용어오류 '${expression}'이(가) 포함되어 있습니다.`,
                        lawReference: '특허법 제42조 제4항 제2호'
                    });
                    
                    // 불명확한 용어오류 위치 정보 저장
                    const regex = new RegExp(escapeRegExp(expression), 'g');
                    let match;
                    
                    while ((match = regex.exec(claim.content)) !== null) {
                        unclearExpressionRefs.push({
                            claimNumber: claim.number,
                            expression: expression,
                            index: match.index,
                            length: match[0].length
                        });
                    }
                }
            }
        }
        
        // === DOM 기반의 새로운 청구항 표시 함수 (수정됨) ===
        function displayClaimsDom(claims) {
            // 수평 레이아웃에서는 오른쪽 패널에 표시
            const targetContainer = document.getElementById('claim-display-right') || claimDisplay;
            targetContainer.innerHTML = '';
            
            // 선택된 카테고리가 있는 경우 해당 카테고리 오류만 표시
            if (selectedCategory) {
                displayClaimsForCategory(targetContainer, claims, selectedCategory);
            } else {
                // 전체 청구항 표시
                displayAllClaims(targetContainer, claims);
            }
        }
        
        // 전체 청구항 표시 함수
        function displayAllClaims(container, claims) {
            claims.forEach(claim => {
                // 청구항 컨테이너 생성
                const claimItem = document.createElement('div');
                claimItem.className = 'claim-item';
                claimItem.setAttribute('data-claim-number', claim.number);
                
                // 청구항 제목 생성
                const claimTitle = document.createElement('h3');
                claimTitle.textContent = `청구항 ${claim.number}`;
                claimItem.appendChild(claimTitle);
                
                // 청구항 내용 컨테이너 생성
                const claimContent = document.createElement('div');
                claimContent.className = 'claim-content';
                
                // 청구항 내용을 토큰화하여 처리
                processDomContent(claimContent, claim);
                
               claimItem.appendChild(claimContent);
                
                // 청구항 클릭 이벤트 추가 (더블클릭으로 편집)
                claimContent.addEventListener('dblclick', function() {
                    startEditing(claimItem, claim.number);
                });
                
                container.appendChild(claimItem);
            });
        }
        
        // 특정 카테고리의 오류가 있는 청구항만 표시하는 함수
        function displayClaimsForCategory(container, claims, category) {
            const categoryResults = resultsByCategoryMap.get(category) || [];
            const affectedClaimNumbers = [...new Set(categoryResults.map(r => r.claimNumber))];
            
            if (affectedClaimNumbers.length === 0) {
                container.innerHTML = '<p>해당 카테고리에 오류가 있는 청구항이 없습니다.</p>';
                return;
            }
            
            affectedClaimNumbers.sort((a, b) => a - b).forEach(claimNumber => {
                const claim = claims.find(c => c.number === claimNumber);
                if (!claim) return;
                
                // 청구항 컨테이너 생성
                const claimItem = document.createElement('div');
                claimItem.className = 'claim-item';
                claimItem.setAttribute('data-claim-number', claim.number);
                
                // 청구항 제목 생성
                const claimTitle = document.createElement('h3');
                claimTitle.textContent = `청구항 ${claim.number}`;
                claimItem.appendChild(claimTitle);
                
                // 청구항 내용 컨테이너 생성
                const claimContent = document.createElement('div');
                claimContent.className = 'claim-content';
                
                // 청구항 내용을 토큰화하여 처리 (특정 카테고리 오류만 하이라이트)
                processDomContentForCategory(claimContent, claim, category);
                
                claimItem.appendChild(claimContent);
                container.appendChild(claimItem);
            });
        }
        
        // 특정 카테고리 오류만 하이라이트하는 DOM 처리 함수
        function processDomContentForCategory(container, claim, category) {
            const content = claim.content;
            
            // 텍스트를 단어와 기호로 분리 (특정 카테고리만)
            const tokens = tokenizeTextForCategory(content, claim, category);
            
            // 각 토큰을 DOM에 추가
            for (const token of tokens) {
                if (token.type === 'text') {
                    container.appendChild(document.createTextNode(token.text));
                } else {
                    const span = document.createElement('span');
                    span.className = token.className;
                    span.textContent = token.text;
                    
                    // 툴팁 추가 (필요한 경우)
                    if (token.tooltip) {
                        span.classList.add('tooltip');
                        const tooltipSpan = document.createElement('span');
                        tooltipSpan.className = 'tooltiptext';
                        tooltipSpan.textContent = token.tooltip;
                        span.appendChild(tooltipSpan);
                    }
                    
                    if (token.onClick) {
                        span.addEventListener('click', token.onClick);
                    }
                    
                    container.appendChild(span);
                }
            }
        }
        
        // 특정 카테고리에 해당하는 토큰만 생성하는 함수
        function tokenizeTextForCategory(text, claim, category) {
            const tokens = [];
            let currentIndex = 0;
            const segments = [];
            
            // 카테고리에 따라 해당하는 세그먼트만 추가
            switch (category) {
                case '청구항 택일적 기재오류':
                    const currentClaimAlternativeErrors = alternativeWordErrors.filter(err => err.claimNumber === claim.number);
                    currentClaimAlternativeErrors.forEach(err => {
                        segments.push({
                            start: err.index,
                            end: err.index + err.length,
                            text: err.pattern,
                            type: 'alternative-word-error',
                            tooltip: err.message
                        });
                    });
                    break;
                    
                case '종결어 일치오류':
                    const inconsistentLastWord = lastWordInconsistencies.find(inc => inc.claimNumber === claim.number);
                    if (inconsistentLastWord && inconsistentLastWord.position) {
                        segments.push({
                            start: inconsistentLastWord.position.start,
                            end: inconsistentLastWord.position.end,
                            text: inconsistentLastWord.dependentWord,
                            type: 'inconsistent-last-word',
                            tooltip: `종결어 일치오류: 독립항 ${inconsistentLastWord.independentClaimNumber}의 종결어(${inconsistentLastWord.independentWord})와 다릅니다.`
                        });
                    }
                    break;
                    
                case '불명확한 용어오류':
                    const currentClaimUnclear = unclearExpressionRefs.filter(ref => ref.claimNumber === claim.number);
                    currentClaimUnclear.forEach(ref => {
                        segments.push({
                            start: ref.index,
                            end: ref.index + ref.length,
                            text: ref.expression,
                            type: 'unclear-expression',
                            tooltip: '불명확한 용어오류입니다.'
                        });
                    });
                    break;
                    
                case '다중종속항 인용오류':
                    const currentClaimMultiple = multipleCitationRefs.filter(ref => ref.claimNumber === claim.number);
                    currentClaimMultiple.forEach(ref => {
                        segments.push({
                            start: ref.index,
                            end: ref.index + ref.length,
                            text: ref.citation,
                            type: 'multiple-citation-error',
                            tooltip: `다중 인용 청구항(${ref.citedClaimNumber})을 참조할 수 없습니다.`
                        });
                    });
                    break;
                    
                case '청구항번호 인용오류':
                    const currentClaimErrorCitations = invalidCitations.filter(err => err.claimNumber === claim.number);
                    currentClaimErrorCitations.forEach(err => {
                        segments.push({
                            start: err.index,
                            end: err.index + err.length,
                            text: err.citation,
                            type: 'citation-error',
                            tooltip: getErrorTooltip(err.type)
                        });
                    });
                    break;
                    
                case '상기 용어오류':
                    const relevantRefs = aboveReferences.filter(ref => ref.claimNumber === claim.number);
                    relevantRefs.forEach(ref => {
                        segments.push({
                            start: ref.matchStart,
                            end: ref.matchEnd,
                            text: ref.fullMatch,
                            type: ref.isAboveIs ? 'highlight-above-is' : 
                                  (ref.isValid ? 'highlight-above-valid' : 'highlight-above-invalid'),
                            tooltip: ref.tooltipMessage,
                            isAboveRef: true,
                            ref: ref
                        });
                    });
                    break;
            }
            
            // 세그먼트 시작 위치에 따라 정렬
            segments.sort((a, b) => a.start - b.start);
            
            // 겹치는 세그먼트 처리
            const finalSegments = [];
            for (let i = 0; i < segments.length; i++) {
                const current = segments[i];
                
                // 이전 세그먼트와 겹치는지 확인
                let overlapped = false;
                for (const prev of finalSegments) {
                    if ((current.start >= prev.start && current.start < prev.end) || 
                        (current.end > prev.start && current.end <= prev.end) ||
                        (prev.start >= current.start && prev.start < current.end)) {
                        overlapped = true;
                        break;
                    }
                }
                
                if (!overlapped) {
                    finalSegments.push(current);
                }
            }
            
            // 최종 세그먼트를 기반으로 토큰 생성
            for (const segment of finalSegments) {
                // 이전 텍스트 추가
                if (segment.start > currentIndex) {
                    tokens.push({
                        type: 'text',
                        text: text.substring(currentIndex, segment.start)
                    });
                }
                
                // 세그먼트 토큰 추가
                const token = {
                    type: 'span',
                    className: segment.type,
                    text: segment.text,
                    tooltip: segment.tooltip
                };
                
                // 상기 용어오류에 대한 특별 처리
                if (segment.isAboveRef && segment.ref && segment.ref.isValid) {
                    token.onClick = function() {
                        highlightOriginalTerm(segment.ref.term);
                    };
                }
                
                tokens.push(token);
                currentIndex = segment.end;
            }
            
            // 남은 텍스트 추가
            if (currentIndex < text.length) {
                tokens.push({
                    type: 'text',
                    text: text.substring(currentIndex)
                });
            }
            
            return tokens;
        }
        
        // DOM 기반 청구항 내용 처리 함수
        function processDomContent(container, claim) {
            const content = claim.content;
            
            // 텍스트를 단어와 기호로 분리
            const tokens = tokenizeText(content, claim);
            
            // 각 토큰을 DOM에 추가
            for (const token of tokens) {
                if (token.type === 'text') {
                    container.appendChild(document.createTextNode(token.text));
                } else {
                    const span = document.createElement('span');
                    span.className = token.className;
                    span.textContent = token.text;
                    
                    // 툴팁 추가 (필요한 경우)
                    if (token.tooltip) {
                        span.classList.add('tooltip');
                        const tooltipSpan = document.createElement('span');
                        tooltipSpan.className = 'tooltiptext';
                        tooltipSpan.textContent = token.tooltip;
                        span.appendChild(tooltipSpan);
                    }
                    
                    if (token.onClick) {
                        span.addEventListener('click', token.onClick);
                    }
                    
                    container.appendChild(span);
                }
            }
        }
        
        // 텍스트 토큰화 함수
        function tokenizeText(text, claim) {
            const tokens = [];
            let currentIndex = 0;
            
            // 텍스트를 세그먼트 단위로 처리하기 위한 배열 생성
            const segments = [];
            
            // 1. 청구항 택일적 기재오류 세그먼트 만들기
            const currentClaimAlternativeErrors = alternativeWordErrors.filter(err => err.claimNumber === claim.number);
            currentClaimAlternativeErrors.forEach(err => {
                segments.push({
                    start: err.index,
                    end: err.index + err.length,
                    text: err.pattern,
                    type: 'alternative-word-error',
                    tooltip: err.message
                });
            });
            
            // 2. 종결어 일치오류 세그먼트 만들기
            const inconsistentLastWord = lastWordInconsistencies.find(inc => inc.claimNumber === claim.number);
            if (inconsistentLastWord && inconsistentLastWord.position) {
                segments.push({
                    start: inconsistentLastWord.position.start,
                    end: inconsistentLastWord.position.end,
                    text: inconsistentLastWord.dependentWord,
                    type: 'inconsistent-last-word',
                    tooltip: `종결어 일치오류: 독립항 ${inconsistentLastWord.independentClaimNumber}의 종결어(${inconsistentLastWord.independentWord})와 다릅니다.`
                });
            }
            
            // 3. 불명확한 용어오류 세그먼트 만들기
            const currentClaimUnclear = unclearExpressionRefs.filter(ref => ref.claimNumber === claim.number);
            currentClaimUnclear.forEach(ref => {
                segments.push({
                    start: ref.index,
                    end: ref.index + ref.length,
                    text: ref.expression,
                    type: 'unclear-expression',
                    tooltip: '불명확한 용어오류입니다.'
                });
            });
            
            // 4. 다중종속항 인용오류 세그먼트 만들기
            const currentClaimMultiple = multipleCitationRefs.filter(ref => ref.claimNumber === claim.number);
            currentClaimMultiple.forEach(ref => {
                segments.push({
                    start: ref.index,
                    end: ref.index + ref.length,
                    text: ref.citation,
                    type: 'multiple-citation-error',
                    tooltip: `다중 인용 청구항(${ref.citedClaimNumber})을 참조할 수 없습니다.`
                });
            });
            
            // 5. 청구항번호 인용오류 세그먼트 만들기
            const currentClaimErrorCitations = invalidCitations.filter(err => err.claimNumber === claim.number);
            currentClaimErrorCitations.forEach(err => {
                segments.push({
                    start: err.index,
                    end: err.index + err.length,
                    text: err.citation,
                    type: 'citation-error',
                    tooltip: getErrorTooltip(err.type)
                });
            });
            
            // 6. 상기 용어오류 세그먼트 만들기
            if (aboveReferences.length > 0) {
                const relevantRefs = aboveReferences.filter(ref => ref.claimNumber === claim.number);
                
                relevantRefs.forEach(ref => {
                    segments.push({
                        start: ref.matchStart,
                        end: ref.matchEnd,
                        text: ref.fullMatch,
                        type: ref.isAboveIs ? 'highlight-above-is' : 
                              (ref.isValid ? 'highlight-above-valid' : 'highlight-above-invalid'),
                        tooltip: ref.tooltipMessage,
                        isAboveRef: true,
                        ref: ref
                    });
                });
            }
            
            // 7. 일반 인용항 패턴을 찾아 세그먼트 생성
            const citationPattern = /(제\s*\d+\s*항(?:\s*(?:내지|부터|~)\s*제\s*\d+\s*항)?|청구항\s*\d+(?:\s*항)?|위\s*항|위의\s*항|상기의?\s*항|선행하는\s*항|앞의\s*항|이전\s*항)/g;
            let match;
            
            while ((match = citationPattern.exec(text)) !== null) {
                // 이미 다른 처리가 된 영역인지 확인
                const overlapping = segments.some(seg => 
                    (match.index >= seg.start && match.index < seg.end) || 
                    (match.index + match[0].length > seg.start && match.index + match[0].length <= seg.end) ||
                    (seg.start >= match.index && seg.start < match.index + match[0].length)
                );
                
                // 중복되지 않는 경우에만 추가
                if (!overlapping) {
                    segments.push({
                        start: match.index,
                        end: match.index + match[0].length,
                        text: match[0],
                        type: 'highlight-cite',
                        tooltip: null
                    });
                }
            }
            
            // 세그먼트 시작 위치에 따라 정렬
            segments.sort((a, b) => a.start - b.start);
            
            // 겹치는 세그먼트 처리
            const finalSegments = [];
            for (let i = 0; i < segments.length; i++) {
                const current = segments[i];
                
                // 이전 세그먼트와 겹치는지 확인
                let overlapped = false;
                for (const prev of finalSegments) {
                    if ((current.start >= prev.start && current.start < prev.end) || 
                        (current.end > prev.start && current.end <= prev.end) ||
                        (prev.start >= current.start && prev.start < current.end)) {
                        overlapped = true;
                        break;
                    }
                }
                
                if (!overlapped) {
                    finalSegments.push(current);
                }
            }
            
            // 최종 세그먼트를 기반으로 토큰 생성
            for (const segment of finalSegments) {
                // 이전 텍스트 추가
                if (segment.start > currentIndex) {
                    tokens.push({
                        type: 'text',
                        text: text.substring(currentIndex, segment.start)
                    });
                }
                
                // 세그먼트 토큰 추가
                const token = {
                    type: 'span',
                    className: segment.type,
                    text: segment.text,
                    tooltip: segment.tooltip
                };
                
                // 상기 용어오류에 대한 특별 처리
                if (segment.isAboveRef && segment.ref && segment.ref.isValid) {
                    token.onClick = function() {
                        highlightOriginalTerm(segment.ref.term);
                    };
                }
                
                tokens.push(token);
                currentIndex = segment.end;
            }
            
            // 남은 텍스트 추가
            if (currentIndex < text.length) {
                tokens.push({
                    type: 'text',
                    text: text.substring(currentIndex)
                });
            }
            
            return tokens;
        }
        
        // 에러 유형에 따른 툴팁 메시지 반환
        function getErrorTooltip(errorType) {
            switch (errorType) {
                case 'self-reference':
                    return '자기 자신을 참조할 수 없습니다.';
                case 'bigger-reference':
                    return '자신보다 큰 번호의 청구항을 참조할 수 없습니다.';
                case 'invalid-citation':
                    return '존재하지 않는 청구항을 참조하고 있습니다.';
                case 'invalid-range':
                    return '잘못된 범위 기재입니다. 큰 번호부터 작은 번호로 기재할 수 없습니다.';
                case 'vague-citation':
                    return '인용하는 청구항이 명확하게 특정되지 않았습니다.';
                default:
                    return '청구항번호 인용오류입니다.';
            }
        }
        
        // 원본 용어 하이라이트
        function highlightOriginalTerm(term) {
            // 먼저 이전 하이라이트 제거
            clearOriginalTermHighlights();
            
            // 모든 청구항 내용에서 해당 용어 찾기
            const claimContents = document.querySelectorAll('.claim-content');
            
            claimContents.forEach(content => {
                const textContent = content.textContent;
                if (textContent.includes(term)) {
                    highlightTermInNode(content, term);
                }
                
                // 조사가 붙은 형태도 검색
                for (const particle of koreanParticles) {
                    const termWithParticle = term + particle;
                    if (textContent.includes(termWithParticle)) {
                        highlightTermInNode(content, termWithParticle);
                    }
                }
            });
        }
        
        // 노드 내에서 용어를 찾아 하이라이트
        function highlightTermInNode(node, term) {
            const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
            let textNode;
            
            while ((textNode = walker.nextNode())) {
                if (textNode.textContent.includes(term)) {
                    const parent = textNode.parentNode;
                    if (parent.classList && parent.classList.contains('highlight-above-valid')) {
                        continue; // 이미 '상기' 부분으로 하이라이트된 용어는 건너뜀
                    }
                    
                    const text = textNode.textContent;
                    const parts = text.split(term);
                    
                    if (parts.length > 1) {
                        const fragment = document.createDocumentFragment();
                        
                        for (let i = 0; i < parts.length; i++) {
                            fragment.appendChild(document.createTextNode(parts[i]));
                            
                            if (i < parts.length - 1) {
                                const span = document.createElement('span');
                                span.className = 'highlight-original-term';
                                span.textContent = term;
                                fragment.appendChild(span);
                            }
                        }
                        
                        parent.replaceChild(fragment, textNode);
                    }
                }
            }
        }
        
        // 원본 용어 하이라이트 제거 함수
        function clearOriginalTermHighlights() {
            document.querySelectorAll('.highlight-original-term').forEach(el => {
                const parent = el.parentNode;
                parent.replaceChild(document.createTextNode(el.textContent), el);
                
                // 텍스트 노드 병합
                parent.normalize();
            });
        }
        
        // 점검 결과를 카테고리별로 표시 (수정됨 - 카테고리 클릭 기능 추가)
        function displayResultsByCategory() {
            resultCategories.innerHTML = '';
            
            if (resultsByCategoryMap.size === 0) {
                resultSection.style.display = 'none';
                return;
            }
            
            resultSection.style.display = 'block';
            
            // 카테고리 순서 정의 (우선순위 설정)
            const categoryOrder = [
                '상기 용어오류',
                '불명확한 용어오류',
                '청구항번호 인용오류',
                '종결어 일치오류',
                '청구항 택일적 기재오류',
                '다중종속항 인용오류'
            ];
            
            // 카테고리 정렬
            const sortedCategories = Array.from(resultsByCategoryMap.keys()).sort((a, b) => {
                const indexA = categoryOrder.indexOf(a);
                const indexB = categoryOrder.indexOf(b);
                return indexA - indexB;
            });
            
            // 각 카테고리별 결과 표시
            sortedCategories.forEach(category => {
                const results = resultsByCategoryMap.get(category);
                if (!results || results.length === 0) return;
                
                // 카테고리 섹션 생성
                const categorySection = document.createElement('div');
                categorySection.className = 'result-category';
                
                // 카테고리 제목 (클릭 가능하게 수정)
                const categoryTitle = document.createElement('h3');
                categoryTitle.textContent = category;
                categoryTitle.style.cursor = 'pointer';
                categoryTitle.style.color = '#4d86cb';
                categoryTitle.addEventListener('click', () => {
                    selectCategory(category);
                });
                
                // 선택된 카테고리 표시
                if (selectedCategory === category) {
                    categoryTitle.style.backgroundColor = '#e8f5e9';
                    categoryTitle.style.padding = '5px';
                    categoryTitle.style.borderRadius = '3px';
                }
                
                categorySection.appendChild(categoryTitle);
                
                // 결과 테이블 생성
                const table = document.createElement('table');
                table.className = 'result-table';
                
                // 테이블 헤더
                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');
                
                const headers = ['청구항', '점검 결과', '관련 법조항'];
                headers.forEach(headerText => {
                    const th = document.createElement('th');
                    th.textContent = headerText;
                    headerRow.appendChild(th);
                });
                
                thead.appendChild(headerRow);
                table.appendChild(thead);
                
                // 테이블 본문
                const tbody = document.createElement('tbody');
                
                results.forEach(result => {
                    const row = document.createElement('tr');
                    
                    // 청구항 번호 셀
                    const claimCell = document.createElement('td');
                    claimCell.textContent = result.claimNumber;
                    row.appendChild(claimCell);
                    
                    // 점검 결과 셀
                    const resultCell = document.createElement('td');
                    resultCell.textContent = result.result;
                    row.appendChild(resultCell);
                    
                    // 관련 법조항 셀
                    const lawCell = document.createElement('td');
                    lawCell.textContent = result.lawReference;
                    row.appendChild(lawCell);
                    
                    tbody.appendChild(row);
                });
                
                table.appendChild(tbody);
                categorySection.appendChild(table);
                resultCategories.appendChild(categorySection);
            });
            
            // "전체 보기" 버튼 추가
            const showAllButton = document.createElement('button');
            showAllButton.textContent = '전체 청구항 보기';
            showAllButton.className = 'secondary';
            showAllButton.style.marginTop = '10px';
            showAllButton.addEventListener('click', () => {
                selectCategory(null);
            });
            resultCategories.appendChild(showAllButton);
        }
        
        // 카테고리 선택 함수
        function selectCategory(category) {
            // 이 부분을 함수 맨 처음에 추가
            if (currentSelectedCategory === category) {
                // 같은 카테고리를 다시 클릭하면 전체 보기로 전환
                category = null;
                currentSelectedCategory = null;
            } else {
                // 새로운 카테고리 선택
                currentSelectedCategory = category;
            }

            selectedCategory = category;
            
            // 청구항 표시 업데이트
            displayClaimsDom(claims);
            
            // 결과 표시 업데이트 (선택 상태 반영)
            displayResultsByCategory();
        }
        
        // 청구항 종속 관계 트리 생성 함수 (수정됨)
        function createClaimTree(claims) {
            claimTreeContainer.innerHTML = '';
            
            // 독립항 먼저 표시
            const independentClaims = claims.filter(claim => claim.citations.length === 0);
            
            independentClaims.forEach(indClaim => {
                const claimNode = document.createElement('div');
                claimNode.className = 'claim-node independent-claim';
                claimNode.setAttribute('data-claim', indClaim.number);
                claimNode.setAttribute('data-expanded', 'false');
                
                const toggleIcon = document.createElement('span');
                toggleIcon.className = 'toggle-icon';
                
                claimNode.appendChild(toggleIcon);
                claimNode.appendChild(document.createTextNode(`청구항 ${indClaim.number}`));
                
                claimTreeContainer.appendChild(claimNode);
                
                // 종속항 생성
                createDependentClaims(indClaim.number, claimNode, claims, 1);
            });
            
            // 토글 기능 추가 (수정됨)
            document.querySelectorAll('.claim-node').forEach(node => {
                node.addEventListener('click', (e) => {
                    // 현재 확장 상태 확인 (data-expanded 속성 사용)
                    const isExpanded = node.getAttribute('data-expanded') === 'true';
                    
                    // 직계 자식 종속항만 선택 (:scope > 사용)
                    const children = node.querySelectorAll(':scope > .dependent-claim');
                    
                    if (!isExpanded) {
                        // 확장: 종속항 표시
                        children.forEach(child => {
                            child.style.display = 'block';
                        });
                        node.setAttribute('data-expanded', 'true');
                    } else {
                        // 접기: 종속항 숨김
                        children.forEach(child => {
                            child.style.display = 'none';
                            
                            // 하위 종속항들도 모두 접기
                            const subNodes = child.querySelectorAll('.dependent-claim');
                            subNodes.forEach(subNode => {
                                subNode.style.display = 'none';
                            });
                            
                            // 하위 노드의 확장 상태도 리셋
                            if (child.classList.contains('claim-node')) {
                                child.setAttribute('data-expanded', 'false');
                            }
                        });
                        node.setAttribute('data-expanded', 'false');
                    }
                    
                    // 확장 클래스 토글 (아이콘 변경용)
                    node.classList.toggle('expanded', !isExpanded);
                    
                    // 이벤트 버블링 방지
                    e.stopPropagation();
                });
            });
        }
        
        // 종속항 트리 노드 생성
        function createDependentClaims(parentClaimNumber, parentNode, claims, level) {
            const directDependents = claims.filter(claim => 
                claim.citations.includes(parentClaimNumber) && claim.number !== parentClaimNumber
            );
            
            directDependents.forEach(depClaim => {
                const depNode = document.createElement('div');
                const levelClass = `level-${level}`;
                const firstLevelClass = level === 1 ? ' first-level' : '';
                depNode.className = `claim-node dependent-claim ${levelClass}${firstLevelClass}`;
                depNode.setAttribute('data-claim', depClaim.number);
                depNode.setAttribute('data-expanded', 'false');
                
                const toggleIcon = document.createElement('span');
                toggleIcon.className = 'toggle-icon';
                
                depNode.appendChild(toggleIcon);
                depNode.appendChild(document.createTextNode(`청구항 ${depClaim.number}`));
                
                parentNode.appendChild(depNode);
                
                // 재귀적으로 하위 종속항 생성
                createDependentClaims(depClaim.number, depNode, claims, level + 1);
            });
        }
        
 // 페이지 로드 시 URL 파라미터 확인 및 처리 (최종 통합 버전)
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const claimsParam = urlParams.get('claims');
    const autoParam = urlParams.get('auto');
    
    if (claimsParam) {
        // URL 파라미터가 있는 경우: 청구항 자동 로드 및 점검
        console.log('URL에서 청구항 파라미터 발견');
        
        try {
            const decoded = decodeURIComponent(atob(claimsParam));
            console.log('청구항 디코딩 성공, 길이:', decoded.length);
            
            setTimeout(function() {
                if (claimInput) {
                    claimInput.value = decoded;
                    console.log('청구항 자동 입력 완료');
                    
                    // auto=true인 경우 자동으로 점검 실행
                    if (autoParam === 'true') {
                        console.log('자동 점검 실행 시도');
                        
                        setTimeout(function() {
                            console.log('checkButton 상태:', checkButton);
                            console.log('claimInput 값:', claimInput.value.length);
                            
                            // 직접 점검 로직 실행
                            try {
                                console.log('방법1: 직접 점검 함수 실행');
                                
                                const text = claimInput.value.trim();
                                if (!text) {
                                    console.log('텍스트가 비어있음');
                                    return;
                                }
                                
                                // 청구항 파싱 및 분석
                                claims = parseClaimText(text);
                                console.log('파싱된 청구항 수:', claims.length);
                                
                                // 청구항 점검 전 초기화
                                invalidCitations = [];
                                aboveReferences = [];
                                unclearExpressionRefs = [];
                                multipleCitationRefs = [];
                                lastWordInconsistencies = [];
                                alternativeWordErrors = [];
                                resultsByCategoryMap = new Map();
                                selectedCategory = null;
                                
                                // 청구항 점검 실행
                                checkClaims(claims);
                                setupHorizontalLayout();
                                displayClaimsDom(claims);
                                displayResultsByCategory();
                                createClaimTree(claims);
                                
                                console.log('자동 점검 완료');
                                
                            } catch (error) {
                                console.error('자동 점검 실행 오류:', error);
                                if (checkButton) {
                                    checkButton.click();
                                }
                            }
                        }, 1500);
                    }
                }
            }, 1000);
            
        } catch (error) {
            console.error('청구항 디코딩 오류:', error);
            alert('청구항 데이터를 불러오는 중 오류가 발생했습니다.');
        }
        } else {
            // URL 파라미터가 없는 경우: 기본 샘플 실행
            // (이미 위에서 샘플 텍스트가 설정되어 있으므로 자동 클릭 불필요)
            console.log('URL 파라미터 없음 - 기본 샘플 사용');
        }
});