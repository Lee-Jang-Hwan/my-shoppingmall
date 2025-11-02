graph TD
Start([방문]) --> Home[홈페이지<br/>최신상품/카테고리/인기상품/콜라보]

    Home --> Login{로그인?}
    Login -->|No| SignIn[Clerk 로그인/회원가입]
    SignIn --> Home
    Login -->|Yes| Browse[상품 탐색]

    Home --> Browse[상품 탐색]
    Browse --> Category[카테고리 선택]
    Category --> Products[상품 목록<br/>필터/정렬/페이지네이션]

    Products --> Detail[상품 상세<br/>옵션 선택: 사이즈/색상<br/>수량 선택]

    Detail --> CartAction{장바구니 추가<br/>또는 즉시구매?}
    CartAction -->|장바구니 추가| AddCart[장바구니에 추가<br/>옵션/수량 저장]
    CartAction -->|즉시 구매| CheckoutDirect[주문 페이지<br/>직접 이동]

    AddCart --> Cart[장바구니<br/>수량 변경/삭제]

    Cart --> CheckoutBtn{주문하기}
    CheckoutBtn --> Checkout[주문 페이지<br/>/checkout]

    CheckoutDirect --> Checkout
    Checkout --> ShippingForm[배송 정보 입력<br/>이름/연락처/주소<br/>요청사항]

    ShippingForm --> OrderReview[주문 확인<br/>상품 목록/배송 정보<br/>금액 계산: subtotal<br/>배송비 계산: 5만원 이상 무료<br/>최종 결제 금액]

    OrderReview --> EditShipping{배송 정보<br/>수정?}
    EditShipping -->|Yes| ShippingForm
    EditShipping -->|No| CreateOrder[주문 생성<br/>orders 테이블 저장<br/>order_items 저장]

    CreateOrder --> Pay[Toss Payments<br/>테스트 결제]

    Pay --> PayResult{결제 결과}
    PayResult -->|성공| OrderComplete[주문 완료<br/>/checkout/complete<br/>주문 번호 표시]
    PayResult -->|실패| OrderReview

    OrderComplete --> Action{다음 액션}
    Action -->|주문 내역 보기| MyOrders[마이페이지<br/>주문 내역]
    Action -->|쇼핑 계속| Home

    Home --> MyOrders
    MyOrders --> OrderFilter[주문 상태 필터링<br/>전체/결제대기/확인됨<br/>배송중/완료/취소]
    OrderFilter --> MyOrders

    MyOrders --> OrderDetail[주문 상세<br/>/my/orders/(id)<br/>주문 정보/상품 목록<br/>배송 정보/결제 정보]

    OrderDetail --> CancelOrder{주문 취소?}
    CancelOrder -->|취소 가능 상태| CancelConfirm[주문 취소 확인]
    CancelConfirm --> OrderDetail
    CancelOrder -->|취소 불가| OrderDetail

    %% 어드민 플로우
    Login -->|관리자| AdminCheck{관리자 권한?}
    AdminCheck -->|Yes| Admin[어드민 대시보드<br/>/admin]
    AdminCheck -->|No| Browse

    Admin --> AdminProducts[상품 관리]
    AdminProducts --> AddProduct[상품 등록<br/>이미지 업로드<br/>옵션 설정]
    AdminProducts --> EditProduct[상품 수정]
    AdminProducts --> DeleteProduct[상품 삭제]

    style Start fill:#e1f5e1
    style Home fill:#e1f5ff
    style OrderComplete fill:#f0e1ff
    style Pay fill:#ffe1e1
    style SignIn fill:#fff4e1
    style Admin fill:#ffe1f5
    style MyOrders fill:#e1ffe1
    style OrderDetail fill:#f0ffe1
